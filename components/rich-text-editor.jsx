'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

const DEFAULT_EMPTY_DOC = '<p></p>';
const ACCEPTED_FILE_TYPES = 'image/*,video/*,audio/*,.zip,.pdf,.txt,.md,.json';

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

function buildHtmlForFile({ file, url, editor }) {
  const escapedName = escapeAttribute(file.name || 'attachment');
  if (file.type.startsWith('image/')) {
    return `<figure class="detail-embed detail-embed--image"><img src="${url}" alt="${escapedName}" /></figure>`;
  }
  if (file.type.startsWith('video/')) {
    return `<figure class="detail-embed detail-embed--video"><video controls src="${url}"></video></figure>`;
  }
  if (file.type.startsWith('audio/')) {
    return `<figure class="detail-embed detail-embed--audio"><audio controls src="${url}"></audio></figure>`;
  }
  const selectionText = editor?.state?.doc?.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
    '\n'
  );
  const linkLabel = escapeHtml(selectionText?.trim() || file.name || 'attachment');
  return `<p><a href="${url}" target="_blank" rel="noopener noreferrer">${linkLabel}</a></p>`;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Start editing…', initialContent }) {
  const fileInputRef = useRef(null);
  const uploadFilesRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const startingContent = useMemo(() => {
    if (value && value.trim().length > 0) return value;
    if (initialContent && initialContent.trim().length > 0) return initialContent;
    return DEFAULT_EMPTY_DOC;
  }, [initialContent, value]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3, 4] }
        }),
        Image.configure({ allowBase64: false }),
        Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
        Placeholder.configure({ placeholder })
      ],
      content: startingContent,
      editorProps: {
        attributes: {
          class: 'admin-editor__surface',
          spellCheck: 'false'
        },
        handlePaste(_, event) {
          const files = Array.from(event.clipboardData?.files ?? []);
          if (!files.length) return false;
          event.preventDefault();
          uploadFilesRef.current?.(files);
          return true;
        },
        handleDrop(_, event) {
          const files = Array.from(event.dataTransfer?.files ?? []);
          if (!files.length) return false;
          event.preventDefault();
          uploadFilesRef.current?.(files);
          return true;
        }
      },
      onUpdate: ({ editor: activeEditor }) => {
        onChange?.(activeEditor.getHTML());
      }
    },
    [placeholder, startingContent]
  );

  const uploadFiles = useCallback(
    async (files) => {
      if (!editor || !files.length) return;
      setIsUploading(true);
      try {
        for (const file of files) {
          const body = new FormData();
          body.append('file', file);
          const response = await fetch('/api/upload', {
            method: 'POST',
            body
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result?.error || 'Upload failed');
          }
          if (!result?.url) continue;
          const html = buildHtmlForFile({ file, url: result.url, editor });
          editor.chain().focus().insertContent(html).run();
        }
      } catch (error) {
        console.error(error);
        alert(error.message);
      } finally {
        setIsUploading(false);
      }
    },
    [editor]
  );

  useEffect(() => {
    uploadFilesRef.current = uploadFiles;
  }, [uploadFiles]);

  useEffect(() => {
    if (!editor) return;
    const nextContent = value && value.trim().length > 0 ? value : startingContent;
    if (nextContent !== editor.getHTML()) {
      editor.commands.setContent(nextContent, false);
    }
  }, [editor, startingContent, value]);

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event) => {
      const fileList = Array.from(event.target.files ?? []);
      if (!fileList.length) return;
      uploadFiles(fileList);
      event.target.value = '';
    },
    [uploadFiles]
  );

  const applyCommand = useCallback(
    (callback) => {
      if (!editor) return;
      callback(editor.chain().focus());
    },
    [editor]
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
      <EditorContent editor={editor} />
    </div>
  );
}
