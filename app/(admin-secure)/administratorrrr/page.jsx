'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAdminFetch } from '@/components/admin-session-context';
import { ChevronDoubleDownIcon, ChevronDoubleUpIcon } from '@/components/icons';

// Dynamically import heavy editor components to reduce admin bundle size
const RichTextEditor = dynamic(() => import('@/components/rich-text-editor'), {
  loading: () => <div className="editor-loading">Loading editor...</div>,
  ssr: false
});

const CoverImageUploader = dynamic(() => import('@/components/cover-image-uploader'), {
  loading: () => <div className="uploader-loading">Loading uploader...</div>,
  ssr: false
});

const TYPE_OPTIONS = [
  { id: 'projects', label: 'Projects' },
  { id: 'words', label: 'Words' },
  { id: 'sounds', label: 'Sounds' },
  { id: 'art', label: 'Art' }
];

const INITIAL_CONTENT = '<p></p>';

const listDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

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

function formatListMeta(entry) {
  const dateLabel = entry?.createdAt ? listDateFormatter.format(new Date(entry.createdAt)) : 'Unknown';
  const statusLabel = entry?.status === 'published' ? 'Published' : 'Draft';
  return `${dateLabel} • ${statusLabel}`;
}

function buildInitialForm() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    title: '',
    slug: '',
    summary: '',
    tagsText: '',
    status: 'draft',
    coverImageUrl: '',
    coverImageAlt: '',
    createdAt: today,
    content: INITIAL_CONTENT
  };
}

export default function AdminPage() {
  const adminFetch = useAdminFetch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const slugParam = searchParams.get('slug');

  const initialType = useMemo(() => {
    if (typeParam && TYPE_OPTIONS.some((option) => option.id === typeParam)) {
      return typeParam;
    }
    return TYPE_OPTIONS[0].id;
  }, [typeParam]);

  const [activeType, setActiveType] = useState(initialType);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(buildInitialForm);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isEntryPanelCollapsed, setIsEntryPanelCollapsed] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  const updateUrlState = useCallback(
    (nextType, nextSlug) => {
      const params = new URLSearchParams();
      const resolvedType = nextType && TYPE_OPTIONS.some((option) => option.id === nextType)
        ? nextType
        : activeType;
      if (resolvedType) {
        params.set('type', resolvedType);
      }
      if (nextSlug) {
        params.set('slug', nextSlug);
      }
      const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [activeType, pathname, router]
  );

  useEffect(() => {
    if (typeParam && TYPE_OPTIONS.some((option) => option.id === typeParam) && typeParam !== activeType) {
      setActiveType(typeParam);
    }
  }, [typeParam, activeType]);

  const refreshEntries = useCallback(async (type) => {
    const response = await adminFetch(`/api/content/${type}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to load entries');
    }
    return data.entries ?? [];
  }, [adminFetch]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const items = await refreshEntries(activeType);
        if (ignore) return;
        setEntries(items);
        setStatusMessage('');
      } catch (error) {
        if (ignore) return;
        console.error(error);
        setStatusMessage(error.message);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [activeType, refreshEntries]);

  const handleSelect = useCallback((entry) => {
    setSelectedSlug(entry.slug);
    setForm({
      title: entry.title,
      slug: entry.slug,
      summary: entry.summary ?? '',
      tagsText: (entry.tags ?? []).join(', '),
      status: entry.status || 'draft',
      coverImageUrl: entry.coverImage?.url || '',
      coverImageAlt: entry.coverImage?.alt || '',
      createdAt: formatDateValue(entry.createdAt),
      content: entry.content || INITIAL_CONTENT
    });
    setStatusMessage('');
    updateUrlState(activeType, entry.slug);
  }, [activeType, updateUrlState]);

  const handleNew = useCallback(() => {
    setSelectedSlug(null);
    setForm(buildInitialForm());
    setStatusMessage('');
    updateUrlState(activeType, null);
  }, [activeType, updateUrlState]);

  useEffect(() => {
    if (!entries.length) {
      return;
    }
    if (slugParam) {
      if (selectedSlug === slugParam) {
        return;
      }
      const match = entries.find((entry) => entry.slug === slugParam);
      if (match) {
        handleSelect(match);
      }
      return;
    }
    if (selectedSlug) {
      handleNew();
    }
  }, [entries, slugParam, selectedSlug, handleSelect, handleNew]);

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

  const handleStatusChange = useCallback((nextStatus) => {
    setForm((prev) => ({ ...prev, status: nextStatus }));
  }, []);

  const handleCoverChange = useCallback(({ url, alt }) => {
    setForm((prev) => ({ ...prev, coverImageUrl: url || '', coverImageAlt: alt || '' }));
  }, []);

  const toggleEntryPanel = useCallback(() => {
    setIsEntryPanelCollapsed((prev) => !prev);
  }, []);

  const toggleEditorFullscreen = useCallback(() => {
    setIsEditorFullscreen((prev) => !prev);
  }, []);

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
        status: form.status === 'published' ? 'published' : 'draft',
        coverImage: form.coverImageUrl
          ? { url: form.coverImageUrl.trim(), alt: form.coverImageAlt.trim() }
          : null,
        createdAt: formatDateValue(form.createdAt) || new Date().toISOString().slice(0, 10)
      };

      if (!payload.title || !payload.slug) {
        throw new Error('Title and slug are required');
      }

      const method = selectedSlug ? 'PUT' : 'POST';
      const response = await adminFetch(`/api/content/${activeType}`, {
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
  }, [activeType, adminFetch, form, refreshEntries, selectedSlug]);

  const handleDelete = useCallback(async () => {
    if (!selectedSlug) return;
    const confirmDelete = window.confirm('Delete this entry?');
    if (!confirmDelete) return;
    try {
      const response = await adminFetch(`/api/content/${activeType}?slug=${selectedSlug}`, {
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
  }, [activeType, adminFetch, handleNew, refreshEntries, selectedSlug]);

  const handleDuplicate = useCallback(async () => {
    if (!selectedSlug) return;
    try {
      const res = await adminFetch(`/api/content/${activeType}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: selectedSlug })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Duplicate failed');
      const items = await refreshEntries(activeType);
      setEntries(items);
      setSelectedSlug(data.entry.slug);
      setStatusMessage('Duplicated');
    } catch (error) {
      console.error(error);
      setStatusMessage(error.message);
    }
  }, [activeType, adminFetch, refreshEntries, selectedSlug]);

  const isEditingExisting = useMemo(() => Boolean(selectedSlug), [selectedSlug]);

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <div>
          <h1>Content Console</h1>
          <p>Create and maintain projects, words, and sounds in one focused surface.</p>
        </div>
        <nav className="admin-shell__types" aria-label="Content types">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`admin-type${activeType === option.id ? ' is-active' : ''}`}
            onClick={() => {
              if (activeType === option.id) return;
              setActiveType(option.id);
              updateUrlState(option.id, null);
              setSelectedSlug(null);
              setForm(buildInitialForm());
            }}
            >
              {option.label}
            </button>
          ))}
        </nav>
      </header>

      <section
        className={`admin-layout${
          isEntryPanelCollapsed ? ' admin-layout--panel-collapsed' : ''
        }${isEditorFullscreen ? ' admin-layout--editor-fullscreen' : ''}`}
      >
        <div
          className={`admin-drawer admin-drawer--top${isEntryPanelCollapsed ? ' is-collapsed' : ''}`}
          aria-label="Entries"
          role="region"
        >
          <div className="admin-drawer__top">
            <button
              type="button"
              className="admin-icon-button"
              onClick={toggleEntryPanel}
              aria-label={isEntryPanelCollapsed ? 'Expand entry panel' : 'Collapse entry panel'}
            >
              <span aria-hidden="true" className="admin-icon-button__icon">
                {isEntryPanelCollapsed ? <ChevronDoubleDownIcon /> : <ChevronDoubleUpIcon />}
              </span>
            </button>
            <button type="button" className="admin-ghost" onClick={handleNew}>
              New Entry
            </button>
          </div>
          <div className="admin-drawer__scroller">
            <ul className="admin-drawer__list">
              {entries.map((entry) => {
                const isActive = selectedSlug === entry.slug;
                return (
                  <li key={entry.slug}>
                    <button
                      type="button"
                      className={`admin-drawer__item${isActive ? ' is-selected' : ''}`}
                      onClick={() => handleSelect(entry)}
                    >
                      <span className="admin-drawer__item-title">{entry.title || 'Untitled entry'}</span>
                      <span className="admin-drawer__item-meta">{formatListMeta(entry)}</span>
                    </button>
                  </li>
                );
              })}
              {!entries.length && <li className="admin-drawer__empty">No entries yet</li>}
            </ul>
          </div>
        </div>

        <div className="admin-workspace">
        <div className="admin-workspace__header">
          <div className="admin-workspace__status" role="status" aria-live="polite">
            {statusMessage ? <span className="admin-status">{statusMessage}</span> : null}
          </div>
          <div className="admin-actions">
            <div className="admin-actions__buttons">
              {isEditingExisting && (
                <button type="button" className="admin-ghost" onClick={handleDuplicate}>
                  Duplicate
                </button>
              )}
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

        <div className="admin-workspace__grid">
          <section className="admin-editor-card">
            <div className="admin-field admin-field--title">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={form.title}
                placeholder="Give this entry a title"
                onChange={(event) => handleFieldChange('title', event.target.value)}
              />
            </div>

            <div className="admin-editor-card__body">
              <Suspense fallback={<div className="editor-loading">Loading editor...</div>}>
                <RichTextEditor
                  value={form.content}
                  initialContent={INITIAL_CONTENT}
                  onChange={(value) => handleFieldChange('content', value)}
                  isFullscreen={isEditorFullscreen}
                  onToggleFullscreen={toggleEditorFullscreen}
                />
              </Suspense>
            </div>
          </section>

          <aside className="admin-sidebar" aria-label="Entry meta">
            <section className="admin-panel">
              <header className="admin-panel__header">
                <h2>Publishing</h2>
              </header>
              <div className="admin-panel__body admin-panel__body--grid">
                <div className="admin-field admin-field--status">
                  <span>Status</span>
                  <div className="admin-status-group" role="radiogroup" aria-label="Entry status">
                    <button
                      type="button"
                      className={`admin-status-pill${form.status !== 'published' ? ' is-active' : ''}`}
                      onClick={() => handleStatusChange('draft')}
                      aria-pressed={form.status !== 'published'}
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      className={`admin-status-pill${form.status === 'published' ? ' is-active' : ''}`}
                      onClick={() => handleStatusChange('published')}
                      aria-pressed={form.status === 'published'}
                    >
                      Published
                    </button>
                  </div>
                </div>
                <div className="admin-field">
                  <label htmlFor="createdAt">Publish date</label>
                  <input
                    id="createdAt"
                    type="date"
                    value={form.createdAt}
                    onChange={(event) => handleFieldChange('createdAt', event.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="admin-panel">
              <header className="admin-panel__header">
                <h2>Metadata</h2>
              </header>
              <div className="admin-panel__body admin-panel__body--grid">
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
                  rows={4}
                  value={form.summary}
                  onChange={(event) => handleFieldChange('summary', event.target.value)}
                />
              </div>
            </section>

            <section className="admin-panel">
              <header className="admin-panel__header">
                <h2>Media</h2>
              </header>
              <div className="admin-panel__body">
                <div className="admin-field admin-field--cover">
                  <span>Cover image</span>
                  <Suspense fallback={<div className="uploader-loading">Loading uploader...</div>}>
                    <CoverImageUploader
                      value={form.coverImageUrl}
                      alt={form.coverImageAlt}
                      onChange={handleCoverChange}
                    />
                  </Suspense>
                </div>
                <div className="admin-field">
                  <label htmlFor="coverAlt">Cover alt text</label>
                  <input
                    id="coverAlt"
                    type="text"
                    value={form.coverImageAlt}
                    onChange={(event) => handleFieldChange('coverImageAlt', event.target.value)}
                    placeholder="Describe the cover image for accessibility"
                  />
                </div>
              </div>
            </section>
          </aside>
        </div>
        </div>
      </section>

    </div>
  );
}
