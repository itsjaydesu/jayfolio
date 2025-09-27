'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

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

function ToolbarButton({ label, onClick, disabled, active }) {
  return (
    <button
      type="button"
      className={`admin-toolbar__button${active ? ' admin-toolbar__button--active' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder = 'Start editing…', initialContent }) {
  const fileInputRef = useRef(null);
  const uploadFilesRef = useRef(null);
  const abortControllersRef = useRef(new Set());
  const isMountedRef = useRef(true);
  const lastSyncedHtmlRef = useRef('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

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
      StarterKit.configure({
        heading: { levels: [2, 3, 4] }
      }),
      Image.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Placeholder.configure({ placeholder })
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
        },
        handlePaste: (_, event) => {
          const files = Array.from(event.clipboardData?.files ?? []);
          if (!files.length) return false;
          event.preventDefault();
          uploadFilesRef.current?.(files);
          return true;
        },
        handleDrop: (_, event) => {
          const files = Array.from(event.dataTransfer?.files ?? []);
          if (!files.length) return false;
          event.preventDefault();
          uploadFilesRef.current?.(files);
          return true;
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

  const wrapSelectionAsCodeBlock = useCallback(() => {
    applyCommand((chain) => chain.toggleCodeBlock().run());
  }, [applyCommand]);

  const toggleHeader = useCallback(() => {
    applyCommand((chain) => chain.toggleHeading({ level: 2 }).run());
  }, [applyCommand]);

  const toggleQuote = useCallback(() => {
    applyCommand((chain) => chain.toggleBlockquote().run());
  }, [applyCommand]);

  const toggleBulletList = useCallback(() => {
    applyCommand((chain) => chain.toggleBulletList().run());
  }, [applyCommand]);

  const insertHorizontalRule = useCallback(() => {
    applyCommand((chain) => chain.setHorizontalRule().run());
  }, [applyCommand]);

  if (!editor) {
    return <div className="admin-editor">Loading editor…</div>;
  }

  return (
    <div className="admin-editor">
      <div className="admin-toolbar">
        <ToolbarButton
          label="Bold"
          onClick={() => applyCommand((chain) => chain.toggleBold().run())}
          active={editor.isActive('bold')}
        />
        <ToolbarButton
          label="Italic"
          onClick={() => applyCommand((chain) => chain.toggleItalic().run())}
          active={editor.isActive('italic')}
        />
        <ToolbarButton label="Heading" onClick={toggleHeader} active={editor.isActive('heading', { level: 2 })} />
        <ToolbarButton label="Quote" onClick={toggleQuote} active={editor.isActive('blockquote')} />
        <ToolbarButton label="List" onClick={toggleBulletList} active={editor.isActive('bulletList')} />
        <ToolbarButton label="Code" onClick={wrapSelectionAsCodeBlock} active={editor.isActive('codeBlock')} />
        <ToolbarButton label="Rule" onClick={insertHorizontalRule} />
        <ToolbarButton label={isUploading ? 'Uploading…' : 'Upload'} onClick={handleFileButtonClick} disabled={isUploading} />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="admin-toolbar__file"
          onChange={handleFileChange}
          accept={ACCEPTED_FILE_TYPES}
        />
      </div>
      {uploadError ? (
        <p className="admin-status admin-status--error" role="alert">
          {uploadError}
        </p>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}
