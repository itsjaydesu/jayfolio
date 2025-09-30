'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FileHandler from '@tiptap/extension-file-handler';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

// Mirrors the server-side default document so we never render an empty editor root.
const DEFAULT_EMPTY_DOC = '<p></p>';

// Matches the allow-list enforced by the upload API so the client can fail fast.
const ACCEPTED_FILE_TYPES = 'image/*,video/*,audio/*,.zip,.pdf,.txt,.md,.json';
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_FILES_PER_BATCH = 6;

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/'];
const ALLOWED_MIME_TYPES = new Set([
  'application/zip',
  'application/pdf',
  'application/json',
  'text/plain',
  'text/markdown'
]);
const ALLOWED_EXTENSIONS = ['.zip', '.pdf', '.txt', '.md', '.json'];

const BLOCK_OPTIONS = [
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'Heading 2', value: 'heading-2' },
  { label: 'Heading 3', value: 'heading-3' },
  { label: 'Heading 4', value: 'heading-4' },
  { label: 'Quote', value: 'blockquote' },
  { label: 'Code Block', value: 'codeBlock' }
];

function escapeAttribute(value) {
  const raw = String(value ?? '');
  return raw
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(value) {
  const raw = String(value ?? '');
  return raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isAllowedFile(file) {
  const type = file?.type ?? '';
  if (ALLOWED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix))) {
    return true;
  }
  if (ALLOWED_MIME_TYPES.has(type)) {
    return true;
  }

  const name = (file?.name ?? '').toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension));
}

function normalizeContent(raw) {
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    return DEFAULT_EMPTY_DOC;
  }
  return raw;
}

function getSelectedText(editor) {
  if (!editor) return '';
  const { state } = editor;
  if (!state) return '';
  const { from, to } = state.selection;
  if (from === to) return '';
  return state.doc.textBetween(from, to, '\n');
}

function buildHtmlForFile({ file, url, editor }) {
  const safeUrl = escapeAttribute(url);
  const altText = escapeAttribute(file?.name || 'attachment');

  if (file?.type?.startsWith('image/')) {
    return `<figure class="detail-embed detail-embed--image"><img src="${safeUrl}" alt="${altText}" /></figure>`;
  }

  if (file?.type?.startsWith('video/')) {
    return `<figure class="detail-embed detail-embed--video"><video controls src="${safeUrl}"></video></figure>`;
  }

  if (file?.type?.startsWith('audio/')) {
    return `<figure class="detail-embed detail-embed--audio"><audio controls src="${safeUrl}"></audio></figure>`;
  }

  const selectionText = getSelectedText(editor);
  const linkLabel = escapeHtml(selectionText?.trim() || file?.name || 'attachment');
  return `<p><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${linkLabel}</a></p>`;
}

function ToolbarButton({ label, icon, onClick, disabled, active, ariaLabel }) {
  return (
    <button
      type="button"
      className={`admin-toolbar__button${active ? ' admin-toolbar__button--active' : ''}`}
      title={label}
      aria-label={ariaLabel || label}
      onClick={onClick}
      disabled={disabled}
    >
      {icon ?? label}
    </button>
  );
}

function ToolbarGroup({ children, className = '' }) {
  const groupClassName = className ? `admin-toolbar__group ${className}` : 'admin-toolbar__group';
  return <div className={groupClassName}>{children}</div>;
}

function ColorControl({ id, label, value, onChange, onClear, disabled }) {
  return (
    <div className="admin-toolbar__color">
      <label className="admin-toolbar__color-label" htmlFor={id}>
        <span>{label}</span>
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
        />
      </label>
      <button
        type="button"
        className="admin-toolbar__button admin-toolbar__button--ghost"
        onClick={onClear}
        disabled={disabled}
        aria-label={`Clear ${label.toLowerCase()}`}
        title={`Clear ${label.toLowerCase()}`}
      >
        ×
      </button>
    </div>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start editing…',
  initialContent,
  isFullscreen = false,
  onToggleFullscreen
}) {
  const fileInputRef = useRef(null);
  const uploadFilesRef = useRef(null);
  const abortControllersRef = useRef(new Set());
  const isMountedRef = useRef(true);
  const lastSyncedHtmlRef = useRef('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [textColor, setTextColor] = useState('#86deff');
  const [highlightColor, setHighlightColor] = useState('#15343c');
  const [snapshot, setSnapshot] = useState(null);
  const [toolbarState, setToolbarState] = useState({ block: 'paragraph', align: 'left' });

  // Preserve the initial content snapshot for the lifetime of this component instance.
  const initialEditorContentRef = useRef(
    normalizeContent(
      value && value.trim().length > 0
        ? value
        : initialContent && initialContent.trim().length > 0
          ? initialContent
          : DEFAULT_EMPTY_DOC
    )
  );

  const extensions = useMemo(
    () => [
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      Highlight.configure({ multicolor: true }),
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true }
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: 'admin-editor__table' }
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Placeholder.configure({ placeholder }),
      FileHandler.configure({
        onDrop: (_editor, files) => uploadFilesRef.current?.(files),
        onPaste: (_editor, files) => uploadFilesRef.current?.(files)
      })
    ],
    [placeholder]
  );

  const editor = useEditor(
    {
      extensions,
      content: initialEditorContentRef.current,
      editorProps: {
        attributes: {
          class: 'admin-editor__surface',
          spellCheck: 'false'
        }
      },
      onCreate: ({ editor: createdEditor }) => {
        lastSyncedHtmlRef.current = createdEditor.getHTML();
        if (!value || value.trim().length === 0) {
          onChange?.(lastSyncedHtmlRef.current);
        }
      },
      onUpdate: ({ editor: activeEditor }) => {
        const nextHtml = activeEditor.getHTML();
        lastSyncedHtmlRef.current = nextHtml;
        onChange?.(nextHtml);
      },
      immediatelyRender: false
    },
    [extensions]
  );

  useEffect(() => {
    if (!editor || editor.isDestroyed) return undefined;

    const updateToolbarState = () => {
      if (!editor || editor.isDestroyed) return;

      let block = 'paragraph';
      if (editor.isActive('heading', { level: 2 })) {
        block = 'heading-2';
      } else if (editor.isActive('heading', { level: 3 })) {
        block = 'heading-3';
      } else if (editor.isActive('heading', { level: 4 })) {
        block = 'heading-4';
      } else if (editor.isActive('blockquote')) {
        block = 'blockquote';
      } else if (editor.isActive('codeBlock')) {
        block = 'codeBlock';
      }

      let align = 'left';
      if (editor.isActive({ textAlign: 'justify' })) {
        align = 'justify';
      } else if (editor.isActive({ textAlign: 'right' })) {
        align = 'right';
      } else if (editor.isActive({ textAlign: 'center' })) {
        align = 'center';
      }

      setToolbarState((previous) =>
        previous.block === block && previous.align === align ? previous : { block, align }
      );

      const activeColor = editor.getAttributes('textStyle')?.color;
      if (activeColor && typeof activeColor === 'string') {
        setTextColor((current) => (current === activeColor ? current : activeColor));
      }

      const highlightAttrs = editor.getAttributes('highlight');
      const activeHighlight = highlightAttrs?.color || highlightAttrs?.background;
      if (activeHighlight && typeof activeHighlight === 'string') {
        setHighlightColor((current) => (current === activeHighlight ? current : activeHighlight));
      }
    };

    const events = ['selectionUpdate', 'transaction', 'update'];
    events.forEach((event) => editor.on(event, updateToolbarState));
    updateToolbarState();

    return () => {
      events.forEach((event) => editor.off(event, updateToolbarState));
    };
  }, [editor]);

  const validateFile = useCallback((file) => {
    if (!(file instanceof File)) {
      return new Error('Only file uploads are supported.');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
      return new Error(`"${file.name}" exceeds the ${sizeMb}MB upload limit.`);
    }
    if (!isAllowedFile(file)) {
      return new Error(`"${file.name}" is not an accepted file type.`);
    }
    return null;
  }, []);

  const insertUploadedFile = useCallback(
    (file, url) => {
      if (!editor || editor.isDestroyed) {
        throw new Error('Editor is not ready.');
      }
      const html = buildHtmlForFile({ file, url, editor });
      editor.chain().focus().insertContent(html).run();
    },
    [editor]
  );

  const uploadSingleFile = useCallback(
    async (file) => {
      const validationError = validateFile(file);
      if (validationError) {
        throw validationError;
      }

      const controller = new AbortController();
      abortControllersRef.current.add(controller);

      try {
        const body = new FormData();
        body.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body,
          signal: controller.signal
        });

        let result;
        try {
          result = await response.json();
        } catch {
          result = null;
        }

        if (!response.ok) {
          const message = result?.error || `Upload failed with status ${response.status}`;
          throw new Error(message);
        }

        if (!result?.url) {
          throw new Error('Upload completed without a file URL.');
        }

        insertUploadedFile(file, result.url);
      } finally {
        abortControllersRef.current.delete(controller);
      }
    },
    [insertUploadedFile, validateFile]
  );

  const uploadFiles = useCallback(
    async (candidates) => {
      if (!editor || editor.isDestroyed) return;

      const files = Array.from(candidates ?? []).filter(Boolean);
      if (!files.length) return;

      const limitedFiles = files.slice(0, MAX_FILES_PER_BATCH);
      const skippedCount = files.length - limitedFiles.length;

      setUploadError(null);
      setIsUploading(true);

      try {
        for (const file of limitedFiles) {
          try {
            await uploadSingleFile(file);
          } catch (error) {
            if (error?.name === 'AbortError') {
              return;
            }
            console.error('[rich-text-editor] upload failure', error);
            if (isMountedRef.current) {
              setUploadError((previous) => previous ?? (error?.message || 'Upload failed.'));
            }
          }
        }
      } finally {
        if (isMountedRef.current) {
          setIsUploading(false);
          if (skippedCount > 0) {
            setUploadError((previous) =>
              previous ?? `Only the first ${limitedFiles.length} file(s) were uploaded to keep the queue responsive.`
            );
          }
        }
      }
    },
    [editor, uploadSingleFile]
  );

  useEffect(() => {
    uploadFilesRef.current = uploadFiles;
  }, [uploadFiles]);

  useEffect(() => {
    const controllerSet = abortControllersRef.current;
    return () => {
      isMountedRef.current = false;
      const controllers = Array.from(controllerSet);
      controllers.forEach((controller) => {
        try {
          controller.abort();
        } catch (abortError) {
          console.warn('[rich-text-editor] abort failed', abortError);
        }
      });
      controllerSet.clear();
    };
  }, []);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const nextContent = normalizeContent(value);
    if (nextContent === lastSyncedHtmlRef.current) {
      return;
    }
    editor.commands.setContent(nextContent, false);
    lastSyncedHtmlRef.current = editor.getHTML();
  }, [editor, value]);

  const applyCommand = useCallback(
    (command) => {
      if (!editor || editor.isDestroyed) return;
      command(editor.chain().focus());
    },
    [editor]
  );

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event) => {
      const fileList = Array.from(event.target.files ?? []);
      if (fileList.length) {
        uploadFiles(fileList);
      }
      event.target.value = '';
    },
    [uploadFiles]
  );

  const toggleQuote = useCallback(() => {
    applyCommand((chain) => chain.toggleBlockquote().run());
  }, [applyCommand]);

  const toggleBulletList = useCallback(() => {
    applyCommand((chain) => chain.toggleBulletList().run());
  }, [applyCommand]);

  const insertHorizontalRule = useCallback(() => {
    applyCommand((chain) => chain.setHorizontalRule().run());
  }, [applyCommand]);

  const setBlockStyle = useCallback(
    (nextValue) => {
      if (!editor || editor.isDestroyed) return;
      const chain = editor.chain().focus();
      switch (nextValue) {
        case 'heading-2':
          chain.setHeading({ level: 2 }).run();
          break;
        case 'heading-3':
          chain.setHeading({ level: 3 }).run();
          break;
        case 'heading-4':
          chain.setHeading({ level: 4 }).run();
          break;
        case 'blockquote':
          chain.toggleBlockquote().run();
          break;
        case 'codeBlock':
          chain.toggleCodeBlock().run();
          break;
        case 'paragraph':
        default:
          chain.setParagraph().run();
          break;
      }
    },
    [editor]
  );

  const setTextAlignment = useCallback(
    (alignment) => {
      if (!editor || editor.isDestroyed) return;
      const chain = editor.chain().focus();
      if (alignment === 'left') {
        chain.unsetTextAlign().run();
        return;
      }
      chain.setTextAlign(alignment).run();
    },
    [editor]
  );

  const handleColorChange = useCallback(
    (value) => {
      setTextColor(value);
      applyCommand((chain) => chain.setColor(value).run());
    },
    [applyCommand]
  );

  const clearColor = useCallback(() => {
    setTextColor('#86deff');
    applyCommand((chain) => chain.unsetColor().run());
  }, [applyCommand]);

  const handleHighlightChange = useCallback(
    (value) => {
      setHighlightColor(value);
      applyCommand((chain) => chain.setHighlight({ color: value }).run());
    },
    [applyCommand]
  );

  const clearHighlight = useCallback(() => {
    setHighlightColor('#15343c');
    applyCommand((chain) => chain.unsetHighlight().run());
  }, [applyCommand]);

  const captureSnapshot = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    setSnapshot({ html: editor.getHTML(), createdAt: Date.now() });
  }, [editor]);

  const restoreSnapshot = useCallback(() => {
    if (!editor || editor.isDestroyed || !snapshot?.html) return;
    editor.commands.setContent(snapshot.html, false);
    lastSyncedHtmlRef.current = editor.getHTML();
    onChange?.(lastSyncedHtmlRef.current);
  }, [editor, onChange, snapshot]);

  useEffect(() => {
    if (!isFullscreen) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  if (!editor) {
    return <div className={`admin-editor${isFullscreen ? ' admin-editor--fullscreen' : ''}`}>Loading editor…</div>;
  }

  const canUndo = editor.can().undo?.() ?? false;
  const canRedo = editor.can().redo?.() ?? false;
  const canIndent = editor.can().sinkListItem?.('listItem') ?? false;
  const canOutdent = editor.can().liftListItem?.('listItem') ?? false;
  const canAddColumn = editor.can().addColumnAfter?.() ?? false;
  const canAddRow = editor.can().addRowAfter?.() ?? false;
  const canDeleteTable = editor.can().deleteTable?.() ?? false;
  const snapshotTimestamp = snapshot?.createdAt
    ? new Date(snapshot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const editorClassName = `admin-editor${isFullscreen ? ' admin-editor--fullscreen' : ''}`;

  return (
    <div className={editorClassName}>
      <div className="admin-toolbar" role="toolbar" aria-label="Rich text controls">
        <ToolbarGroup>
          <ToolbarButton
            label="Undo"
            icon={<span aria-hidden="true">↺</span>}
            onClick={() => applyCommand((chain) => chain.undo().run())}
            disabled={!canUndo}
            ariaLabel="Undo"
          />
          <ToolbarButton
            label="Redo"
            icon={<span aria-hidden="true">↻</span>}
            onClick={() => applyCommand((chain) => chain.redo().run())}
            disabled={!canRedo}
            ariaLabel="Redo"
          />
          <ToolbarButton
            label="Save snapshot"
            icon={<span aria-hidden="true">◎</span>}
            onClick={captureSnapshot}
            disabled={editor.isEmpty}
            ariaLabel="Save snapshot"
          />
          <ToolbarButton
            label="Restore snapshot"
            icon={<span aria-hidden="true">⟲</span>}
            onClick={restoreSnapshot}
            disabled={!snapshot?.html}
            ariaLabel="Restore snapshot"
          />
        </ToolbarGroup>

        <ToolbarGroup className="admin-toolbar__group--stacked">
          <label htmlFor="admin-editor-block" className="admin-toolbar__select-label">
            Block
          </label>
          <select
            id="admin-editor-block"
            className="admin-toolbar__select"
            value={toolbarState.block}
            onChange={(event) => setBlockStyle(event.target.value)}
          >
            {BLOCK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            label="Bold"
            icon={<span aria-hidden="true">B</span>}
            onClick={() => applyCommand((chain) => chain.toggleBold().run())}
            active={editor.isActive('bold')}
            ariaLabel="Bold"
          />
          <ToolbarButton
            label="Italic"
            icon={<span aria-hidden="true">I</span>}
            onClick={() => applyCommand((chain) => chain.toggleItalic().run())}
            active={editor.isActive('italic')}
            ariaLabel="Italic"
          />
          <ToolbarButton
            label="Underline"
            icon={<span aria-hidden="true">U</span>}
            onClick={() => applyCommand((chain) => chain.toggleUnderline().run())}
            active={editor.isActive('underline')}
            ariaLabel="Underline"
          />
          <ToolbarButton
            label="Strike"
            icon={<span aria-hidden="true">S̶</span>}
            onClick={() => applyCommand((chain) => chain.toggleStrike().run())}
            active={editor.isActive('strike')}
            ariaLabel="Strikethrough"
          />
          <ToolbarButton
            label="Inline code"
            icon={<span aria-hidden="true">{`</>`}</span>}
            onClick={() => applyCommand((chain) => chain.toggleCode().run())}
            active={editor.isActive('code')}
            ariaLabel="Inline code"
          />
          <ToolbarButton
            label="Quote"
            icon={<span aria-hidden="true">❝</span>}
            onClick={toggleQuote}
            active={editor.isActive('blockquote')}
            ariaLabel="Quotation"
          />
          <ToolbarButton
            label="Divider"
            icon={<span aria-hidden="true">─</span>}
            onClick={insertHorizontalRule}
            ariaLabel="Insert divider"
          />
        </ToolbarGroup>

        <ToolbarGroup className="admin-toolbar__group--color">
          <ColorControl
            id="admin-text-color"
            label="Text"
            value={textColor}
            onChange={handleColorChange}
            onClear={clearColor}
          />
          <ColorControl
            id="admin-highlight-color"
            label="Background"
            value={highlightColor}
            onChange={handleHighlightChange}
            onClear={clearHighlight}
          />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            label="Align left"
            icon={<span aria-hidden="true">⟸</span>}
            onClick={() => setTextAlignment('left')}
            active={toolbarState.align === 'left'}
            ariaLabel="Align left"
          />
          <ToolbarButton
            label="Align center"
            icon={<span aria-hidden="true">⇔</span>}
            onClick={() => setTextAlignment('center')}
            active={toolbarState.align === 'center'}
            ariaLabel="Align center"
          />
          <ToolbarButton
            label="Align right"
            icon={<span aria-hidden="true">⟹</span>}
            onClick={() => setTextAlignment('right')}
            active={toolbarState.align === 'right'}
            ariaLabel="Align right"
          />
          <ToolbarButton
            label="Justify"
            icon={<span aria-hidden="true">≡</span>}
            onClick={() => setTextAlignment('justify')}
            active={toolbarState.align === 'justify'}
            ariaLabel="Justify"
          />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            label="Bullet list"
            icon={<span aria-hidden="true">•</span>}
            onClick={toggleBulletList}
            active={editor.isActive('bulletList')}
            ariaLabel="Toggle bullet list"
          />
          <ToolbarButton
            label="Ordered list"
            icon={<span aria-hidden="true">1.</span>}
            onClick={() => applyCommand((chain) => chain.toggleOrderedList().run())}
            active={editor.isActive('orderedList')}
            ariaLabel="Toggle ordered list"
          />
          <ToolbarButton
            label="Indent"
            icon={<span aria-hidden="true">⇥</span>}
            onClick={() => applyCommand((chain) => chain.sinkListItem('listItem').run())}
            disabled={!canIndent}
            ariaLabel="Indent list item"
          />
          <ToolbarButton
            label="Outdent"
            icon={<span aria-hidden="true">⇤</span>}
            onClick={() => applyCommand((chain) => chain.liftListItem('listItem').run())}
            disabled={!canOutdent}
            ariaLabel="Outdent list item"
          />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            label="Insert table"
            icon={<span aria-hidden="true">⌗</span>}
            onClick={() =>
              applyCommand((chain) => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())
            }
            ariaLabel="Insert table"
          />
          <ToolbarButton
            label="Add column"
            icon={<span aria-hidden="true">＋╱</span>}
            onClick={() => applyCommand((chain) => chain.addColumnAfter().run())}
            disabled={!canAddColumn}
            ariaLabel="Add column"
          />
          <ToolbarButton
            label="Add row"
            icon={<span aria-hidden="true">＋╲</span>}
            onClick={() => applyCommand((chain) => chain.addRowAfter().run())}
            disabled={!canAddRow}
            ariaLabel="Add row"
          />
          <ToolbarButton
            label="Delete table"
            icon={<span aria-hidden="true">⌫</span>}
            onClick={() => applyCommand((chain) => chain.deleteTable().run())}
            disabled={!canDeleteTable}
            ariaLabel="Delete table"
          />
        </ToolbarGroup>

        <ToolbarGroup className="admin-toolbar__group--upload">
          <ToolbarButton
            label={isUploading ? 'Uploading…' : 'Upload files'}
            icon={<span aria-hidden="true">⭳</span>}
            onClick={handleFileButtonClick}
            disabled={isUploading}
            ariaLabel="Upload files"
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="admin-toolbar__file"
            onChange={handleFileChange}
            accept={ACCEPTED_FILE_TYPES}
          />
        </ToolbarGroup>

        {onToggleFullscreen ? (
          <ToolbarGroup>
            <ToolbarButton
              label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              icon={<span aria-hidden="true">{isFullscreen ? '⤡' : '⤢'}</span>}
              onClick={onToggleFullscreen}
              ariaLabel={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            />
          </ToolbarGroup>
        ) : null}
      </div>
      {snapshotTimestamp ? (
        <p className="admin-status admin-status--hint" aria-live="polite">
          Snapshot saved at {snapshotTimestamp}.
        </p>
      ) : null}
      {uploadError ? (
        <p className="admin-status admin-status--error" role="alert">
          {uploadError}
        </p>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}
