'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const TYPE_OPTIONS = [
  { id: 'projects', label: 'Projects' },
  { id: 'words', label: 'Words' },
  { id: 'sounds', label: 'Sounds' }
];

const INITIAL_CONTENT = '<p></p>';

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function parseTags(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatDateValue(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(value).toISOString().slice(0, 10);
}

function buildInitialForm() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    title: '',
    slug: '',
    summary: '',
    tagsText: '',
    createdAt: today,
    content: INITIAL_CONTENT
  };
}

function ToolbarButton({ label, onClick, disabled }) {
  return (
    <button type="button" className="admin-toolbar__button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const node = editorRef.current;
    if (!node) return;
    const incoming = value || INITIAL_CONTENT;
    if (node.innerHTML !== incoming) {
      node.innerHTML = incoming;
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const node = editorRef.current;
    if (!node) return;
    onChange?.(node.innerHTML);
  }, [onChange]);

  const applyCommand = useCallback(
    (command, argument = null) => {
      document.execCommand(command, false, argument);
      emitChange();
    },
    [emitChange]
  );

  const insertHTML = useCallback(
    (html) => {
      document.execCommand('insertHTML', false, html);
      emitChange();
    },
    [emitChange]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        setIsUploading(true);
        const data = new FormData();
        data.append('file', file);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: data
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error || 'Upload failed');
        }
        const url = result.url;
        let html = '';
        if (file.type.startsWith('image/')) {
          html = `<figure class="detail-embed detail-embed--image"><img src="${url}" alt="${file.name}" /></figure>`;
        } else if (file.type.startsWith('video/')) {
          html = `<figure class="detail-embed detail-embed--video"><video controls src="${url}"></video></figure>`;
        } else if (file.type.startsWith('audio/')) {
          html = `<figure class="detail-embed detail-embed--audio"><audio controls src="${url}"></audio></figure>`;
        } else {
          html = `<p><a href="${url}" target="_blank" rel="noopener">${file.name}</a></p>`;
        }
        insertHTML(html);
      } catch (error) {
        console.error(error);
        alert(error.message);
      } finally {
        setIsUploading(false);
        event.target.value = '';
      }
    },
    [insertHTML]
  );

  const handleInput = useCallback(() => {
    emitChange();
  }, [emitChange]);

  const wrapCodeBlock = useCallback(() => {
    const selection = window.getSelection();
    const selected = selection?.toString();
    if (selected) {
      insertHTML(`<pre><code>${selected}</code></pre>`);
    } else {
      insertHTML('<pre><code>// code</code></pre>');
    }
  }, [insertHTML]);

  return (
    <div className="admin-editor">
      <div className="admin-toolbar">
        <ToolbarButton label="Bold" onClick={() => applyCommand('bold')} />
        <ToolbarButton label="Italic" onClick={() => applyCommand('italic')} />
        <ToolbarButton label="Heading" onClick={() => applyCommand('formatBlock', 'h2')} />
        <ToolbarButton label="Quote" onClick={() => applyCommand('formatBlock', 'blockquote')} />
        <ToolbarButton label="List" onClick={() => applyCommand('insertUnorderedList')} />
        <ToolbarButton label="Code" onClick={wrapCodeBlock} />
        <ToolbarButton label={isUploading ? 'Uploading…' : 'Upload'} onClick={handleUploadClick} disabled={isUploading} />
        <input
          ref={fileInputRef}
          type="file"
          className="admin-toolbar__file"
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*,.zip,.pdf,.txt,.md,.json"
        />
      </div>
      <div
        ref={editorRef}
        className="admin-editor__surface"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        spellCheck={false}
      />
    </div>
  );
}

export default function AdminPage() {
  const [activeType, setActiveType] = useState(TYPE_OPTIONS[0].id);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(buildInitialForm);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const refreshEntries = useCallback(async (type) => {
    const response = await fetch(`/api/content/${type}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to load entries');
    }
    return data.entries ?? [];
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const items = await refreshEntries(activeType);
        setEntries(items);
        setSelectedSlug(null);
        setForm(buildInitialForm());
      } catch (error) {
        console.error(error);
        setStatusMessage(error.message);
      }
    })();
  }, [activeType, refreshEntries]);

  const handleSelect = useCallback(
    (entry) => {
      setSelectedSlug(entry.slug);
      setForm({
        title: entry.title,
        slug: entry.slug,
        summary: entry.summary ?? '',
        tagsText: (entry.tags ?? []).join(', '),
        createdAt: formatDateValue(entry.createdAt),
        content: entry.content || INITIAL_CONTENT
      });
      setStatusMessage('');
    },
    []
  );

  const handleNew = useCallback(() => {
    setSelectedSlug(null);
    setForm(buildInitialForm());
    setStatusMessage('');
  }, []);

  const handleFieldChange = useCallback(
    (field, value) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        if (field === 'title' && !selectedSlug) {
          next.slug = slugify(value);
        }
        return next;
      });
    },
    [selectedSlug]
  );

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      setStatusMessage('');
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        summary: form.summary.trim(),
        content: form.content,
        tags: parseTags(form.tagsText),
        createdAt: formatDateValue(form.createdAt) || new Date().toISOString().slice(0, 10)
      };

      if (!payload.title || !payload.slug) {
        throw new Error('Title and slug are required');
      }

      const method = selectedSlug ? 'PUT' : 'POST';
      const response = await fetch(`/api/content/${activeType}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Save failed');
      }

      const items = await refreshEntries(activeType);
      setEntries(items);
      setSelectedSlug(payload.slug);
      setStatusMessage('Saved');
    } catch (error) {
      console.error(error);
      setStatusMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }, [activeType, form, refreshEntries, selectedSlug]);

  const handleDelete = useCallback(async () => {
    if (!selectedSlug) return;
    const confirmDelete = window.confirm('Delete this entry?');
    if (!confirmDelete) return;
    try {
      const response = await fetch(`/api/content/${activeType}?slug=${selectedSlug}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Delete failed');
      }
      const items = await refreshEntries(activeType);
      setEntries(items);
      handleNew();
      setStatusMessage('Deleted');
    } catch (error) {
      console.error(error);
      setStatusMessage(error.message);
    }
  }, [activeType, handleNew, refreshEntries, selectedSlug]);

  const isEditingExisting = useMemo(() => Boolean(selectedSlug), [selectedSlug]);

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <div>
          <h1>Content Console</h1>
          <p>Manage project, words, and sound entries. Upload media, edit copy, and shareable detail pages update instantly.</p>
        </div>
        <nav className="admin-shell__types" aria-label="Content types">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`admin-type${activeType === option.id ? ' is-active' : ''}`}
              onClick={() => setActiveType(option.id)}
            >
              {option.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="admin-shell__main">
        <aside className="admin-list" aria-label="Entries">
          <div className="admin-list__actions">
            <button type="button" className="admin-ghost" onClick={handleNew}>
              New Entry
            </button>
          </div>
          <ul className="admin-list__items">
            {entries.map((entry) => (
              <li key={entry.slug}>
                <button
                  type="button"
                  className={`admin-list__item${selectedSlug === entry.slug ? ' is-selected' : ''}`}
                  onClick={() => handleSelect(entry)}
                >
                  <span>{entry.title}</span>
                  <small>{entry.slug}</small>
                </button>
              </li>
            ))}
            {entries.length === 0 && <li className="admin-list__empty">No entries yet</li>}
          </ul>
        </aside>

        <div className="admin-editor-panel">
          <div className="admin-field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(event) => handleFieldChange('title', event.target.value)}
            />
          </div>
          <div className="admin-field-row">
            <div className="admin-field">
              <label htmlFor="slug">Slug</label>
              <input
                id="slug"
                type="text"
                value={form.slug}
                onChange={(event) => handleFieldChange('slug', event.target.value)}
              />
            </div>
            <div className="admin-field">
              <label htmlFor="createdAt">Date</label>
              <input
                id="createdAt"
                type="date"
                value={form.createdAt}
                onChange={(event) => handleFieldChange('createdAt', event.target.value)}
              />
            </div>
            <div className="admin-field">
              <label htmlFor="tags">Tags</label>
              <input
                id="tags"
                type="text"
                placeholder="ambient, installation"
                value={form.tagsText}
                onChange={(event) => handleFieldChange('tagsText', event.target.value)}
              />
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="summary">Summary</label>
            <textarea
              id="summary"
              rows={3}
              value={form.summary}
              onChange={(event) => handleFieldChange('summary', event.target.value)}
            />
          </div>

          <div className="admin-field">
            <label>Body</label>
            <RichTextEditor value={form.content} onChange={(value) => handleFieldChange('content', value)} />
          </div>

          <div className="admin-actions">
            {statusMessage && <span className="admin-status">{statusMessage}</span>}
            <div className="admin-actions__buttons">
              {isEditingExisting && (
                <button type="button" className="admin-danger" onClick={handleDelete}>
                  Delete
                </button>
              )}
              <button type="button" className="admin-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
