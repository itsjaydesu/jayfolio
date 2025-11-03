'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { mergeAttributes, Node } from '@tiptap/core';
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
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CodeIcon,
  CollapseIcon,
  DividerIcon,
  ExpandIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  RestoreIcon,
  SnapshotIcon,
  StrikethroughIcon,
  TableColumnIcon,
  TableIcon,
  TableRowIcon,
  TrashIcon,
  UnderlineIcon,
  UndoIcon,
  UploadIcon
} from './icons';
import { useAdminFetch } from './admin-session-context';
import { useUploader } from './use-uploader';
import { sanitizeAlt } from './uploader-utils';
import ImagePreprocessorDialog from './image-preprocessor-dialog';

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

const INLINE_MEDIA_ALIGNMENT_OPTIONS = [
  { label: 'Left', value: 'left', icon: AlignLeftIcon },
  { label: 'Center', value: 'center', icon: AlignCenterIcon },
  { label: 'Right', value: 'right', icon: AlignRightIcon }
];

const INLINE_MEDIA_WIDTH_OPTIONS = [
  { label: '25%', value: '25' },
  { label: '50%', value: '50' },
  { label: '100%', value: '100' }
];

function LinkIconGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.5 10.5 10.5 13.5" />
      <path d="M9 16a3 3 0 0 1 0-4.24l3.76-3.76a3 3 0 1 1 4.24 4.24l-.76.76" />
      <path d="M15 8a3 3 0 0 1 0 4.24l-3.76 3.76a3 3 0 1 1-4.24-4.24l.76-.76" />
    </svg>
  );
}

function UnlinkIconGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 14.5 7 17" />
      <path d="m17 7-2.5 2.5" />
      <path d="M12.5 9.5 10 12a3 3 0 0 1-4.24-4.24l1.24-1.24" />
      <path d="M14.5 12.5 17 10a3 3 0 0 1 0 4.24l-1.24 1.24" />
    </svg>
  );
}

const InlineMedia = Node.create({
  name: 'inlineMedia',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      pathname: { default: '' },
      alignment: { default: 'center' },
      width: { default: '100' },
      caption: { default: '' }
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-inline-media]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const { src, alt, pathname, alignment, width, caption, ...rest } = HTMLAttributes;
    const safeAttributes = { ...rest };
    delete safeAttributes.style;
    delete safeAttributes.class;
    const mediaAlignment = alignment || 'center';
    const mediaWidth = width || '100';
    const figureAttributes = mergeAttributes(
      {
        'data-inline-media': 'true',
        'data-alignment': mediaAlignment,
        'data-width': mediaWidth,
        ...(pathname ? { 'data-pathname': pathname } : {}),
        class: `editor-media editor-media--${mediaAlignment}`,
        style: `--editor-media-width:${mediaWidth};`
      },
      safeAttributes
    );

    const children = [
      ['img', { src: src || '', alt: alt || '', loading: 'lazy' }]
    ];

    if (caption && caption.length) {
      children.push(['figcaption', { class: 'editor-media__caption' }, caption]);
    }

    return ['figure', figureAttributes, ...children];
  },
  addCommands() {
    return {
      insertInlineMedia:
        (attrs) =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: {
                src: attrs?.src || '',
                alt: attrs?.alt || '',
                pathname: attrs?.pathname || '',
                alignment: attrs?.alignment || 'center',
                width: attrs?.width || '100',
                caption: attrs?.caption || ''
              }
            })
            .run(),
      setInlineMediaAlignment:
        (alignment) =>
        ({ chain }) =>
          chain()
            .focus()
            .updateAttributes(this.name, { alignment })
            .run(),
      setInlineMediaWidth:
        (width) =>
        ({ chain }) =>
          chain()
            .focus()
            .updateAttributes(this.name, { width })
            .run(),
      setInlineMediaCaption:
        (caption) =>
        ({ chain }) =>
          chain()
            .focus()
            .updateAttributes(this.name, { caption })
            .run()
    };
  }
});

const INITIAL_EDITOR_UI_STATE = {
  status: 'idle',
  error: null,
  pickerOpen: false,
  pending: 0,
  completed: 0,
  duplicates: [],
  rejected: [],
  limited: 0,
  lastInserted: null
};

function toErrorMessage(error, fallback = 'Upload failed.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

function editorUiReducer(state, action) {
  switch (action.type) {
    case 'OPEN_PICKER':
      return { ...state, pickerOpen: true, error: null };
    case 'CLOSE_PICKER':
      return { ...state, pickerOpen: false };
    case 'QUEUE_FILES':
      return action.count
        ? {
            ...state,
            status: 'queued',
            pending: 0,
            completed: 0,
            duplicates: [],
            rejected: [],
            limited: 0,
            error: null
          }
        : {
            ...state,
            status: 'idle',
            pending: 0,
            completed: 0,
            duplicates: [],
            rejected: [],
            limited: 0,
            error: null
          };
    case 'FILE_START':
      return { ...state, status: 'uploading', pending: state.pending + 1 };
    case 'FILE_SUCCESS':
      return {
        ...state,
        pending: Math.max(state.pending - 1, 0),
        completed: state.completed + 1,
        lastInserted: action.payload || null
      };
    case 'FILE_ERROR':
      return {
        ...state,
        pending: Math.max(state.pending - 1, 0),
        status: 'error',
        error: toErrorMessage(action.error)
      };
    case 'FILE_CANCELLED':
      return {
        ...state,
        pending: Math.max(state.pending - 1, 0)
      };
    case 'UPLOAD_BATCH_COMPLETE': {
      const nextStatus = state.error ? 'error' : 'idle';
      return {
        ...state,
        status: state.pending > 0 ? state.status : nextStatus,
        duplicates: action.duplicates || [],
        rejected: action.rejected || [],
        limited: action.limited || 0,
        pickerOpen: false
      };
    }
    case 'RESET_ERROR':
      return {
        ...state,
        error: null,
        status: state.pending > 0 ? state.status : 'idle'
      };
    case 'CLEAR_WARNINGS':
      return { ...state, duplicates: [], rejected: [], limited: 0 };
    default:
      return state;
  }
}

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

function buildHtmlForFile({ file, response, editor }) {
  const safeUrl = escapeAttribute(response?.url || '');
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

function normalizeLinkUrl(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }
  let candidate = input.trim();
  if (!candidate) {
    return '';
  }
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
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
      {icon ? (
        <span className="admin-toolbar__icon" aria-hidden="true">
          {icon}
        </span>
      ) : (
        label
      )}
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
  const adminFetch = useAdminFetch();
  const fileInputRef = useRef(null);
  const inlineImageInputRef = useRef(null);
  const uploadFilesRef = useRef(null);
  const lastSyncedHtmlRef = useRef('');
  const imageProcessorPromiseRef = useRef(null);
  const [imageProcessorState, setImageProcessorState] = useState({ open: false, file: null, token: '' });

  const [uiState, dispatchUi] = useReducer(editorUiReducer, INITIAL_EDITOR_UI_STATE);
  const [textColor, setTextColor] = useState('#86deff');
  const [highlightColor, setHighlightColor] = useState('#15343c');
  const [snapshot, setSnapshot] = useState(null);
  const [toolbarState, setToolbarState] = useState({ block: 'paragraph', align: 'left' });
  const [inlineMediaState, setInlineMediaState] = useState({
    isActive: false,
    alignment: 'center',
    width: '100',
    caption: '',
    alt: '',
    src: ''
  });

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
      InlineMedia,
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      Highlight.configure({ multicolor: true }),
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
        link: false
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
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank'
        }
      }),
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

      const inlineAttributes = editor.getAttributes('inlineMedia');
      const inlineActive = editor.isActive('inlineMedia');
      const nextInlineState = {
        isActive: inlineActive,
        alignment: inlineAttributes?.alignment || 'center',
        width: inlineAttributes?.width || '100',
        caption: inlineAttributes?.caption || '',
        alt: inlineAttributes?.alt || '',
        src: inlineAttributes?.src || ''
      };

      setInlineMediaState((previous) => {
        if (
          previous.isActive === nextInlineState.isActive &&
          previous.alignment === nextInlineState.alignment &&
          previous.width === nextInlineState.width &&
          previous.caption === nextInlineState.caption &&
          previous.alt === nextInlineState.alt &&
          previous.src === nextInlineState.src
        ) {
          return previous;
        }
        return nextInlineState;
      });
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
      return 'Only file uploads are supported.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
      return `"${file.name}" exceeds the ${sizeMb}MB upload limit.`;
    }
    if (!isAllowedFile(file)) {
      return `"${file.name}" is not an accepted file type.`;
    }
    return null;
  }, []);

  const insertUploadedFile = useCallback(
    (file, response) => {
      if (!editor || editor.isDestroyed) {
        throw new Error('Editor is not ready.');
      }
      if (!response?.url) {
        throw new Error('Upload completed without a file URL.');
      }

      if (file?.type?.startsWith('image/')) {
        const derivedAlt = sanitizeAlt(file?.name || response?.meta?.name || '') || 'Inline media';
        editor.commands.insertInlineMedia({
          src: response.url,
          alt: derivedAlt,
          pathname: response.pathname || '',
          alignment: 'center',
          width: '100',
          caption: ''
        });
        return;
      }

      const html = buildHtmlForFile({ file, response, editor });
      editor.chain().focus().insertContent(html).run();
    },
    [editor]
  );

  const requestUpload = useCallback(
    async ({ file, signal }) => {
      const body = new FormData();
      body.append('file', file);

      const response = await adminFetch('/api/upload', {
        method: 'POST',
        body,
        signal
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

      return result;
    },
    [adminFetch]
  );

  const { uploadFiles: enqueueUploads, cancelAll: cancelUploads, clearWarnings } = useUploader({
    maxFileSize: MAX_FILE_SIZE_BYTES,
    maxFilesPerBatch: MAX_FILES_PER_BATCH,
    acceptedMimePrefixes: ALLOWED_MIME_PREFIXES,
    acceptedMimeTypes: ALLOWED_MIME_TYPES,
    acceptedExtensions: ALLOWED_EXTENSIONS,
    validateFile,
    requestUpload,
    normalizeResponse: (record, file) => ({
      url: record?.url || '',
      pathname: record?.pathname || '',
      meta: {
        name: file?.name || '',
        type: record?.type || file?.type || '',
        size: record?.size ?? file?.size ?? 0
      }
    }),
    onFileStart: () => {
      dispatchUi({ type: 'FILE_START' });
    },
    onFileSuccess: (payload, file) => {
      try {
        insertUploadedFile(file, payload);
        dispatchUi({ type: 'FILE_SUCCESS', payload });
      } catch (error) {
        dispatchUi({ type: 'FILE_ERROR', error });
      }
    },
    onFileError: (error) => {
      dispatchUi({ type: 'FILE_ERROR', error });
    },
    onFileCancel: () => {
      dispatchUi({ type: 'FILE_CANCELLED' });
    }
  });

  const closeImageProcessor = useCallback(() => {
    setImageProcessorState({ open: false, file: null, token: '' });
  }, [setImageProcessorState]);

  const openImageProcessor = useCallback(
    (file) =>
      new Promise((resolve, reject) => {
        const token =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
        imageProcessorPromiseRef.current = { resolve, reject };
        setImageProcessorState({ open: true, file, token });
      }),
    [imageProcessorPromiseRef, setImageProcessorState]
  );

  const handleProcessorComplete = useCallback(
    (nextFile) => {
      const pending = imageProcessorPromiseRef.current;
      if (pending) {
        pending.resolve(nextFile);
        imageProcessorPromiseRef.current = null;
      }
      closeImageProcessor();
    },
    [closeImageProcessor, imageProcessorPromiseRef]
  );

  const handleProcessorSkip = useCallback(
    (originalFile) => {
      const pending = imageProcessorPromiseRef.current;
      if (pending) {
        pending.resolve(originalFile);
        imageProcessorPromiseRef.current = null;
      }
      closeImageProcessor();
    },
    [closeImageProcessor, imageProcessorPromiseRef]
  );

  const handleProcessorCancel = useCallback(() => {
    const pending = imageProcessorPromiseRef.current;
    if (pending) {
      pending.reject(new Error('cancelled'));
      imageProcessorPromiseRef.current = null;
    }
    closeImageProcessor();
  }, [closeImageProcessor, imageProcessorPromiseRef]);

  const preprocessFiles = useCallback(
    async (files) => {
      const prepared = [];
      for (const file of files) {
        if (file?.type?.startsWith('image/')) {
          const processed = await openImageProcessor(file);
          if (processed) {
            prepared.push(processed);
          }
        } else {
          prepared.push(file);
        }
      }
      return prepared;
    },
    [openImageProcessor]
  );

  const processUploads = useCallback(
    async (candidates) => {
      if (!editor || editor.isDestroyed) {
        dispatchUi({ type: 'FILE_ERROR', error: 'Editor is not ready.' });
        return;
      }

      if (imageProcessorState.open) {
        dispatchUi({ type: 'FILE_ERROR', error: 'Finish adjusting the current image before uploading more files.' });
        return;
      }

      const files = Array.from(candidates ?? []).filter(Boolean);
      clearWarnings();

      if (!files.length) {
        dispatchUi({ type: 'QUEUE_FILES', count: 0 });
        dispatchUi({ type: 'UPLOAD_BATCH_COMPLETE', duplicates: [], rejected: [], limited: 0 });
        return;
      }

      dispatchUi({ type: 'QUEUE_FILES', count: files.length });

      let preparedFiles;
      try {
        preparedFiles = await preprocessFiles(files);
      } catch (preprocessError) {
        const message = preprocessError?.message === 'cancelled' ? 'Upload cancelled.' : preprocessError;
        dispatchUi({ type: 'FILE_ERROR', error: message });
        dispatchUi({ type: 'UPLOAD_BATCH_COMPLETE', duplicates: [], rejected: [], limited: 0 });
        return;
      }

      if (!preparedFiles?.length) {
        dispatchUi({ type: 'UPLOAD_BATCH_COMPLETE', duplicates: [], rejected: [], limited: 0 });
        return;
      }

      try {
        const result = await enqueueUploads(preparedFiles);
        dispatchUi({
          type: 'UPLOAD_BATCH_COMPLETE',
          duplicates: result?.duplicates || [],
          rejected: result?.rejected || [],
          limited: result?.limited || 0
        });
      } catch (error) {
        dispatchUi({ type: 'FILE_ERROR', error });
      }
    },
    [clearWarnings, dispatchUi, editor, enqueueUploads, imageProcessorState.open, preprocessFiles]
  );

  useEffect(() => {
    uploadFilesRef.current = processUploads;
  }, [processUploads]);

  useEffect(
    () => () => {
      cancelUploads();
    },
    [cancelUploads]
  );

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
    dispatchUi({ type: 'RESET_ERROR' });
    dispatchUi({ type: 'OPEN_PICKER' });
    fileInputRef.current?.click();
  }, [dispatchUi]);

  const handleFileChange = useCallback(
    async (event) => {
      const fileList = Array.from(event.target.files ?? []);
      event.target.value = '';
      try {
        await processUploads(fileList);
      } finally {
        dispatchUi({ type: 'CLOSE_PICKER' });
      }
    },
    [dispatchUi, processUploads]
  );

  const handleInlineImageButtonClick = useCallback(() => {
    dispatchUi({ type: 'RESET_ERROR' });
    inlineImageInputRef.current?.click();
  }, [dispatchUi]);

  const handleInlineImageChange = useCallback(
    async (event) => {
      const files = Array.from(event.target.files ?? []).filter((candidate) => candidate.type?.startsWith('image/'));
      event.target.value = '';
      if (!files.length) {
        dispatchUi({ type: 'FILE_ERROR', error: 'Only image uploads are supported for inline media.' });
        return;
      }
      await processUploads(files);
    },
    [dispatchUi, processUploads]
  );

  const handleRetryUpload = useCallback(() => {
    dispatchUi({ type: 'RESET_ERROR' });
    fileInputRef.current?.click();
  }, [dispatchUi]);

  const handleInlineAlignment = useCallback(
    (alignment) => {
      if (!editor || editor.isDestroyed) return;
      editor.commands.setInlineMediaAlignment(alignment);
    },
    [editor]
  );

  const handleInlineWidth = useCallback(
    (width) => {
      if (!editor || editor.isDestroyed) return;
      editor.commands.setInlineMediaWidth(width);
    },
    [editor]
  );

  const handleInlineCaptionEdit = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    const currentCaption = editor.getAttributes('inlineMedia')?.caption || '';
    const next = window.prompt('Edit media caption', currentCaption);
    if (next === null) return;
    editor.commands.setInlineMediaCaption(next.trim());
  }, [editor]);

  const handleRemoveInlineMedia = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    if (!editor.isActive('inlineMedia')) return;
    editor.chain().focus().deleteSelection().run();
  }, [editor]);

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

  const handleSetLink = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    const previousHref = editor.getAttributes('link')?.href || '';
    const nextInput = window.prompt('Enter link URL', previousHref);
    if (nextInput === null) {
      return;
    }

    const normalized = normalizeLinkUrl(nextInput);
    if (normalized === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (!normalized) {
      window.alert('Please enter a valid HTTP or HTTPS URL.');
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: normalized, target: '_blank', rel: 'noopener noreferrer' })
      .run();
  }, [editor]);

  const handleRemoveLink = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    if (!editor.isActive('link')) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  }, [editor]);

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

  const isProcessingImages = imageProcessorState.open;
  const isUploaderBusy = uiState.status === 'uploading' || uiState.status === 'queued';
  const pendingUploads = uiState.pending;
  const uploadErrorMessage = uiState.error;
  const { duplicates, rejected, limited } = uiState;
  const uploadButtonLabel = isProcessingImages
    ? 'Preparing…'
    : isUploaderBusy
      ? pendingUploads > 1
        ? `Uploading (${pendingUploads})`
        : 'Uploading…'
      : 'Upload files';

  const uploadMessages = useMemo(() => {
    const messages = [];

    if (isProcessingImages) {
      messages.push({ variant: 'hint', text: 'Adjusting image before upload…' });
    }

    if (uploadErrorMessage) {
      messages.push({
        variant: 'error',
        text: uploadErrorMessage,
        action: { label: 'Retry upload', handler: handleRetryUpload }
      });
    } else if (isUploaderBusy && pendingUploads > 0) {
      const uploadingText =
        pendingUploads === 1 ? 'Uploading 1 file…' : `Uploading ${pendingUploads} files…`;
      messages.push({ variant: 'hint', text: uploadingText });
    }

    if (limited > 0) {
      messages.push({
        variant: 'hint',
        text: `Skipped ${limited} file${limited === 1 ? '' : 's'} to keep the queue responsive.`
      });
    }

    if (duplicates.length) {
      messages.push({
        variant: 'hint',
        text: `${duplicates.length} duplicate file${duplicates.length === 1 ? '' : 's'} skipped.`
      });
    }

    if (rejected.length) {
      const firstReason = rejected[0]?.reason || 'Unsupported file type.';
      const text =
        rejected.length === 1
          ? firstReason
          : `${rejected.length} file(s) rejected. ${firstReason}`;
      messages.push({
        variant: 'error',
        text,
        action: { label: 'Retry upload', handler: handleRetryUpload }
      });
    }

    return messages;
  }, [
    duplicates,
    handleRetryUpload,
    isProcessingImages,
    isUploaderBusy,
    limited,
    pendingUploads,
    rejected,
    uploadErrorMessage
  ]);

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
  const linkActive = Boolean(editor?.isActive?.('link'));

  return (
    <div className={editorClassName}>
      <div className="admin-toolbar" role="toolbar" aria-label="Rich text controls">
        <ToolbarGroup>
          <ToolbarButton
            label="Undo"
            icon={<UndoIcon />}
            onClick={() => applyCommand((chain) => chain.undo().run())}
            disabled={!canUndo}
            ariaLabel="Undo"
          />
          <ToolbarButton
            label="Redo"
            icon={<RedoIcon />}
            onClick={() => applyCommand((chain) => chain.redo().run())}
            disabled={!canRedo}
            ariaLabel="Redo"
          />
          <ToolbarButton
            label="Save snapshot"
            icon={<SnapshotIcon />}
            onClick={captureSnapshot}
            disabled={editor.isEmpty}
            ariaLabel="Save snapshot"
          />
          <ToolbarButton
            label="Restore snapshot"
            icon={<RestoreIcon />}
            onClick={restoreSnapshot}
            disabled={!snapshot?.html}
            ariaLabel="Restore snapshot"
          />
        </ToolbarGroup>

        <ToolbarGroup className="admin-toolbar__group--select">
          <select
            id="admin-editor-block"
            className="admin-toolbar__select admin-toolbar__select--compact"
            value={toolbarState.block}
            onChange={(event) => setBlockStyle(event.target.value)}
            aria-label="Block style"
            title="Block style"
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
            icon={<BoldIcon />}
            onClick={() => applyCommand((chain) => chain.toggleBold().run())}
            active={editor.isActive('bold')}
            ariaLabel="Bold"
          />
          <ToolbarButton
            label="Italic"
            icon={<ItalicIcon />}
            onClick={() => applyCommand((chain) => chain.toggleItalic().run())}
            active={editor.isActive('italic')}
            ariaLabel="Italic"
          />
          <ToolbarButton
            label="Underline"
            icon={<UnderlineIcon />}
            onClick={() => applyCommand((chain) => chain.toggleUnderline().run())}
            active={editor.isActive('underline')}
            ariaLabel="Underline"
          />
          <ToolbarButton
            label="Strike"
            icon={<StrikethroughIcon />}
            onClick={() => applyCommand((chain) => chain.toggleStrike().run())}
            active={editor.isActive('strike')}
            ariaLabel="Strikethrough"
          />
          <ToolbarButton
            label="Inline code"
            icon={<CodeIcon />}
            onClick={() => applyCommand((chain) => chain.toggleCode().run())}
            active={editor.isActive('code')}
            ariaLabel="Inline code"
          />
          <ToolbarButton
            label="Link"
            icon={<LinkIconGlyph />}
            onClick={handleSetLink}
            active={linkActive}
            ariaLabel="Insert link"
          />
          <ToolbarButton
            label="Remove link"
            icon={<UnlinkIconGlyph />}
            onClick={handleRemoveLink}
            disabled={!linkActive}
            ariaLabel="Remove link"
          />
          <ToolbarButton
            label="Quote"
            icon={<QuoteIcon />}
            onClick={toggleQuote}
            active={editor.isActive('blockquote')}
            ariaLabel="Quotation"
          />
          <ToolbarButton
            label="Divider"
            icon={<DividerIcon />}
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
            icon={<AlignLeftIcon />}
            onClick={() => setTextAlignment('left')}
            active={toolbarState.align === 'left'}
            ariaLabel="Align left"
          />
          <ToolbarButton
            label="Align center"
            icon={<AlignCenterIcon />}
            onClick={() => setTextAlignment('center')}
            active={toolbarState.align === 'center'}
            ariaLabel="Align center"
          />
          <ToolbarButton
            label="Align right"
            icon={<AlignRightIcon />}
            onClick={() => setTextAlignment('right')}
            active={toolbarState.align === 'right'}
            ariaLabel="Align right"
          />
          <ToolbarButton
            label="Justify"
            icon={<AlignJustifyIcon />}
            onClick={() => setTextAlignment('justify')}
            active={toolbarState.align === 'justify'}
            ariaLabel="Justify"
          />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            label="Bullet list"
            icon={<ListIcon />}
            onClick={toggleBulletList}
            active={editor.isActive('bulletList')}
            ariaLabel="Toggle bullet list"
          />
          <ToolbarButton
            label="Ordered list"
            icon={<ListOrderedIcon />}
            onClick={() => applyCommand((chain) => chain.toggleOrderedList().run())}
            active={editor.isActive('orderedList')}
            ariaLabel="Toggle ordered list"
          />
          <ToolbarButton
            label="Indent"
            icon={<IndentIncreaseIcon />}
            onClick={() => applyCommand((chain) => chain.sinkListItem('listItem').run())}
            disabled={!canIndent}
            ariaLabel="Indent list item"
          />
          <ToolbarButton
            label="Outdent"
            icon={<IndentDecreaseIcon />}
            onClick={() => applyCommand((chain) => chain.liftListItem('listItem').run())}
            disabled={!canOutdent}
            ariaLabel="Outdent list item"
          />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            label="Insert table"
            icon={<TableIcon />}
            onClick={() =>
              applyCommand((chain) => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())
            }
            ariaLabel="Insert table"
          />
          <ToolbarButton
            label="Add column"
            icon={<TableColumnIcon />}
            onClick={() => applyCommand((chain) => chain.addColumnAfter().run())}
            disabled={!canAddColumn}
            ariaLabel="Add column"
          />
          <ToolbarButton
            label="Add row"
            icon={<TableRowIcon />}
            onClick={() => applyCommand((chain) => chain.addRowAfter().run())}
            disabled={!canAddRow}
            ariaLabel="Add row"
          />
          <ToolbarButton
            label="Delete table"
            icon={<TrashIcon />}
            onClick={() => applyCommand((chain) => chain.deleteTable().run())}
            disabled={!canDeleteTable}
            ariaLabel="Delete table"
          />
        </ToolbarGroup>

        <ToolbarGroup className="admin-toolbar__group--upload">
          <ToolbarButton
            label="Insert image"
            icon={<UploadIcon />}
          onClick={handleInlineImageButtonClick}
          disabled={isUploaderBusy || imageProcessorState.open}
            ariaLabel="Insert image"
          />
          <ToolbarButton
            label={uploadButtonLabel}
            icon={<UploadIcon />}
          onClick={handleFileButtonClick}
          disabled={isUploaderBusy || imageProcessorState.open}
            ariaLabel={uploadButtonLabel}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="admin-toolbar__file"
            onChange={handleFileChange}
            accept={ACCEPTED_FILE_TYPES}
          />
          <input
            ref={inlineImageInputRef}
            type="file"
            accept="image/*"
            className="admin-toolbar__file"
            onChange={handleInlineImageChange}
          />
        </ToolbarGroup>

        {inlineMediaState.isActive ? (
          <ToolbarGroup>
            {INLINE_MEDIA_ALIGNMENT_OPTIONS.map(({ label, value, icon: IconComponent }) => (
              <ToolbarButton
                key={`inline-align-${value}`}
                label={`Media ${label.toLowerCase()}`}
                icon={<IconComponent />}
                onClick={() => handleInlineAlignment(value)}
                active={inlineMediaState.alignment === value}
                ariaLabel={`Align media ${label.toLowerCase()}`}
              />
            ))}
            {INLINE_MEDIA_WIDTH_OPTIONS.map((option) => (
              <ToolbarButton
                key={`inline-width-${option.value}`}
                label={option.label}
                onClick={() => handleInlineWidth(option.value)}
                active={inlineMediaState.width === option.value}
                ariaLabel={`Set media width to ${option.label}`}
              />
            ))}
            <ToolbarButton
              label="Edit caption"
              onClick={handleInlineCaptionEdit}
              ariaLabel="Edit media caption"
            />
            <ToolbarButton
              label="Remove media"
              onClick={handleRemoveInlineMedia}
              ariaLabel="Remove media"
            />
          </ToolbarGroup>
        ) : null}

        {onToggleFullscreen ? (
          <ToolbarGroup>
            <ToolbarButton
              label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              icon={isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
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
      {uploadMessages.map((message, index) => (
        <div
          key={`upload-message-${index}`}
          className={`admin-status admin-status--${message.variant === 'error' ? 'error' : 'hint'}`}
          role={message.variant === 'error' ? 'alert' : undefined}
        >
          <span>{message.text}</span>
          {message.action ? (
            <button
              type="button"
              className="admin-ghost admin-status__action"
              onClick={message.action.handler}
            >
              {message.action.label}
            </button>
          ) : null}
        </div>
      ))}
      <EditorContent editor={editor} />
      {imageProcessorState.open && imageProcessorState.file ? (
        <ImagePreprocessorDialog
          key={imageProcessorState.token}
          file={imageProcessorState.file}
          onConfirm={handleProcessorComplete}
          onSkip={handleProcessorSkip}
          onCancel={handleProcessorCancel}
        />
      ) : null}
    </div>
  );
}
