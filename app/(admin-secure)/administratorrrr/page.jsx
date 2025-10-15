'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAdminFetch } from '@/components/admin-session-context';
import { ChevronDoubleDownIcon, ChevronDoubleUpIcon } from '@/components/icons';
import { getLocalizedContent } from '@/lib/translations';

// Dynamically import heavy editor components to reduce admin bundle size
const RichTextEditor = dynamic(() => import('@/components/rich-text-editor'), {
  loading: () => <div className="editor-loading">Loading editor...</div>,
  ssr: false
});

const CoverImageUploader = dynamic(() => import('@/components/cover-image-uploader'), {
  loading: () => <div className="uploader-loading">Loading uploader...</div>,
  ssr: false
});

const MediaSelector = dynamic(() => import('@/components/media-selector'), {
  loading: () => <div className="uploader-loading">Loading selector...</div>,
  ssr: false
});

const TYPE_OPTIONS = [
  { id: 'projects', label: 'Projects' },
  { id: 'content', label: 'Content' },
  { id: 'sounds', label: 'Sounds' },
  { id: 'art', label: 'Art' }
];

const LANGUAGE_OPTIONS = [
  { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' }
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
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  return String(value)
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

function ensureLocalizedField(value, defaultEn = '') {
  if (typeof value === 'string') {
    return { en: value, ja: '' };
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      en: typeof value.en === 'string' ? value.en : defaultEn,
      ja: typeof value.ja === 'string' ? value.ja : ''
    };
  }
  return { en: defaultEn, ja: '' };
}

function ensureLocalizedRichText(value) {
  const base = ensureLocalizedField(value, '');
  return {
    en: base.en || INITIAL_CONTENT,
    ja: base.ja || INITIAL_CONTENT
  };
}

function ensureLocalizedTags(value) {
  const toString = (input) => {
    if (Array.isArray(input)) {
      return input.join(', ');
    }
    if (typeof input === 'string') {
      return input;
    }
    return '';
  };

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      en: toString(value.en),
      ja: toString(value.ja)
    };
  }

  return { en: toString(value), ja: '' };
}

function prepareLocalizedField(field) {
  if (typeof field === 'string') {
    return field.trim();
  }
  if (!field || typeof field !== 'object') {
    return '';
  }

  const result = {};
  for (const { id } of LANGUAGE_OPTIONS) {
    const value = typeof field[id] === 'string' ? field[id].trim() : '';
    if (value) {
      result[id] = value;
    }
  }

  const keys = Object.keys(result);
  if (!keys.length) {
    return '';
  }
  if (keys.length === 1 && keys[0] === 'en') {
    return result.en;
  }
  return result;
}

function prepareLocalizedTags(field) {
  if (!field || typeof field !== 'object' || Array.isArray(field)) {
    return parseTags(field);
  }
  const result = {};
  for (const { id } of LANGUAGE_OPTIONS) {
    const tags = parseTags(field[id]);
    if (tags.length) {
      result[id] = tags;
    }
  }
  const keys = Object.keys(result);
  if (!keys.length) {
    return [];
  }
  if (keys.length === 1 && keys[0] === 'en') {
    return result.en;
  }
  return result;
}

function hasFieldValue(value) {
  if (!value) return false;
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'object') {
    return Object.values(value).some((entry) => typeof entry === 'string' && entry.trim().length > 0);
  }
  return false;
}

function buildInitialForm() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    title: { en: '', ja: '' },
    slug: '',
    summary: { en: '', ja: '' },
    tagsText: { en: '', ja: '' },
    status: 'draft',
    coverImageUrl: '',
    coverImageAlt: { en: '', ja: '' },
    backgroundImageUrl: '',
    galleryImages: [],
    createdAt: today,
    content: { en: INITIAL_CONTENT, ja: INITIAL_CONTENT }
  };
}

export default function AdminPage() {
  const adminFetch = useAdminFetch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const slugParam = searchParams.get('slug');
  const panelParam = searchParams.get('panel');

  const initialType = useMemo(() => {
    if (typeParam && TYPE_OPTIONS.some((option) => option.id === typeParam)) {
      return typeParam;
    }
    return TYPE_OPTIONS[0].id;
  }, [typeParam]);

  const [activeType, setActiveType] = useState(initialType);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(buildInitialForm);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const initialPanelCollapsed = useMemo(() => {
    if (panelParam === 'collapsed') {
      return true;
    }
    if (panelParam === 'open') {
      return false;
    }
    return !slugParam;
  }, [panelParam, slugParam]);

  const [isEntryPanelCollapsed, setIsEntryPanelCollapsed] = useState(initialPanelCollapsed);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const prevSlugParamRef = useRef(slugParam);
  const pendingSlugRef = useRef(slugParam);
  const skipSlugSyncRef = useRef(false);

  const updateUrlState = useCallback(
    (nextType, nextSlug, panelState) => {
      // Defer the URL update to avoid updating Router during render
      setTimeout(() => {
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
        const shouldCollapse = typeof panelState === 'boolean' ? panelState : isEntryPanelCollapsed;
        if (shouldCollapse) {
          params.set('panel', 'collapsed');
        }
        const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
        router.replace(nextUrl, { scroll: false });
      }, 0);
    },
    [activeType, isEntryPanelCollapsed, pathname, router]
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
    const fallbackTitle = getLocalizedContent(entry.title, 'en') || entry.title || '';
    pendingSlugRef.current = entry.slug;
    skipSlugSyncRef.current = false;
    setSelectedSlug(entry.slug);
    setForm({
      title: ensureLocalizedField(entry.title, fallbackTitle),
      slug: entry.slug,
      summary: ensureLocalizedField(entry.summary, ''),
      tagsText: ensureLocalizedTags(entry.tags),
      status: entry.status || 'draft',
      coverImageUrl: entry.coverImage?.url || '',
      coverImageAlt: ensureLocalizedField(entry.coverImage?.alt, ''),
      backgroundImageUrl: entry.backgroundImage || '',
      galleryImages: entry.galleryImages || [],
      createdAt: formatDateValue(entry.createdAt),
      content: ensureLocalizedRichText(entry.content || INITIAL_CONTENT)
    });
    setStatusMessage('');
    updateUrlState(activeType, entry.slug);
  }, [activeType, updateUrlState]);

  const handleNew = useCallback(() => {
    pendingSlugRef.current = null;
    skipSlugSyncRef.current = true;
    setSelectedSlug(null);
    setForm(buildInitialForm());
    setStatusMessage('');
    updateUrlState(activeType, null);
    setActiveLanguage('en');
  }, [activeType, updateUrlState]);

  useEffect(() => {
    const previousSlug = prevSlugParamRef.current;
    prevSlugParamRef.current = slugParam;
    const pendingSlug = pendingSlugRef.current;

    if (pendingSlug !== slugParam) {
      if (pendingSlug !== previousSlug) {
        return;
      }
    }

    if (skipSlugSyncRef.current && slugParam === previousSlug) {
      pendingSlugRef.current = slugParam;
      skipSlugSyncRef.current = false;
      return;
    }

    skipSlugSyncRef.current = false;
    pendingSlugRef.current = slugParam;

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

    if (previousSlug) {
      handleNew();
    }
  }, [entries, slugParam, selectedSlug, handleSelect, handleNew]);

  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleLocalizedFieldChange = useCallback(
    (field, language, value) => {
      setForm((prev) => {
        const current = prev[field] && typeof prev[field] === 'object' ? prev[field] : { en: '', ja: '' };
        const nextField = { ...current, [language]: value };
        const next = { ...prev, [field]: nextField };
        if (field === 'title' && language === 'en' && !selectedSlug) {
          next.slug = slugify(value || '');
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
    setForm((prev) => {
      const existingAlt = ensureLocalizedField(prev.coverImageAlt, '');
      const nextAlt = url
        ? { ...existingAlt, [activeLanguage]: alt || '' }
        : { en: '', ja: '' };

      return {
        ...prev,
        coverImageUrl: url || '',
        coverImageAlt: nextAlt
      };
    });
  }, [activeLanguage]);

  const toggleEntryPanel = useCallback(() => {
    setIsEntryPanelCollapsed((prev) => {
      const next = !prev;
      updateUrlState(activeType, selectedSlug ?? null, next);
      return next;
    });
  }, [activeType, selectedSlug, updateUrlState]);

  const toggleEditorFullscreen = useCallback(() => {
    setIsEditorFullscreen((prev) => !prev);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      setStatusMessage('');
      const payload = {
        title: prepareLocalizedField(form.title),
        slug: form.slug.trim(),
        summary: prepareLocalizedField(form.summary),
        content: prepareLocalizedField(form.content),
        tags: prepareLocalizedTags(form.tagsText),
        status: form.status === 'published' ? 'published' : 'draft',
        coverImage: form.coverImageUrl
          ? {
              url: form.coverImageUrl.trim(),
              alt: prepareLocalizedField(form.coverImageAlt)
            }
          : null,
        backgroundImage: form.backgroundImageUrl?.trim() || '',
        galleryImages: form.galleryImages || [],
        createdAt: formatDateValue(form.createdAt) || new Date().toISOString().slice(0, 10)
      };

      if (!hasFieldValue(payload.title) || !payload.slug) {
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
  const titleValue = form.title?.[activeLanguage] ?? '';
  const summaryValue = form.summary?.[activeLanguage] ?? '';
  const tagsValue = form.tagsText?.[activeLanguage] ?? '';
  const coverAltValue = form.coverImageAlt?.[activeLanguage] ?? '';
  const contentValue = form.content?.[activeLanguage] ?? INITIAL_CONTENT;

  return (
    <div
      className={`admin-console${isEntryPanelCollapsed ? ' admin-console--panel-collapsed' : ''}`}
      data-panel-collapsed={isEntryPanelCollapsed ? 'true' : 'false'}
    >
      <aside
        className={`admin-console__drawer${isEntryPanelCollapsed ? ' admin-console__drawer--collapsed' : ''}`}
        aria-label="Entries"
        role="region"
      >
        <div className="admin-console__drawer-top">
          <button
            type="button"
            className="admin-console__collapse"
            onClick={toggleEntryPanel}
            aria-label={isEntryPanelCollapsed ? 'Expand entry panel' : 'Collapse entry panel'}
            aria-expanded={!isEntryPanelCollapsed}
          >
            <span aria-hidden="true" className="admin-console__collapse-icon">
              {isEntryPanelCollapsed ? <ChevronDoubleDownIcon /> : <ChevronDoubleUpIcon />}
            </span>
          </button>
          <button type="button" className="admin-console__new" onClick={handleNew}>
            New Entry
          </button>
        </div>
        <div className="admin-console__list">
          <ul>
            {entries.map((entry) => {
              const isActive = selectedSlug === entry.slug;
              const displayTitle = getLocalizedContent(entry.title, 'en') || 'Untitled entry';
              return (
                <li key={entry.slug}>
                  <button
                    type="button"
                    className={`admin-console__list-item${isActive ? ' is-selected' : ''}`}
                    onClick={() => handleSelect(entry)}
                  >
                    <span className="admin-console__list-title">{displayTitle}</span>
                    <span className="admin-console__list-meta">{formatListMeta(entry)}</span>
                  </button>
                </li>
              );
            })}
            {!entries.length && <li className="admin-console__empty">No entries yet</li>}
          </ul>
        </div>
      </aside>

      <div className="admin-console__canvas" data-panel-collapsed={isEntryPanelCollapsed ? 'true' : 'false'}>
        <div className="admin-console__inline-toggle">
          <button
            type="button"
            className="admin-console__inline-toggle-btn"
            onClick={toggleEntryPanel}
            aria-label={isEntryPanelCollapsed ? 'Show entry list' : 'Hide entry list'}
            aria-expanded={!isEntryPanelCollapsed}
          >
            {isEntryPanelCollapsed ? 'Open Entry List' : 'Hide Entry List'}
          </button>
        </div>
        <header className="editor-toolbar">
          <div className="editor-toolbar__types" aria-label="Content types">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`editor-toolbar__type${activeType === option.id ? ' is-active' : ''}`}
                onClick={() => {
                  if (activeType === option.id) return;
                  setActiveType(option.id);
                  updateUrlState(option.id, null);
                  setSelectedSlug(null);
                  setForm(buildInitialForm());
                  setActiveLanguage('en');
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="editor-toolbar__languages" role="radiogroup" aria-label="Language">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`editor-toolbar__language${activeLanguage === option.id ? ' is-active' : ''}`}
                onClick={() => setActiveLanguage(option.id)}
                aria-pressed={activeLanguage === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        <section className={`editor-stage${isEditorFullscreen ? ' editor-stage--fullscreen' : ''}`}>
          <div className="editor-stage__title">
            <label htmlFor="entry-title" className="editor-stage__label">Title</label>
            <input
              id="entry-title"
              type="text"
              className="editor-stage__title-input"
              value={titleValue}
              placeholder="Give this entry a title"
              onChange={(event) => handleLocalizedFieldChange('title', activeLanguage, event.target.value)}
            />
          </div>

          <div className="editor-stage__richtext">
            <Suspense fallback={<div className="editor-loading">Loading editor...</div>}>
              <RichTextEditor
                value={contentValue}
                initialContent={INITIAL_CONTENT}
                onChange={(value) => handleLocalizedFieldChange('content', activeLanguage, value)}
                isFullscreen={isEditorFullscreen}
                onToggleFullscreen={toggleEditorFullscreen}
              />
            </Suspense>
          </div>

          <div className="editor-stage__meta">
            <div className="editor-meta-grid">
              <section className="editor-panel">
                <header className="editor-panel__header">
                  <h2>Publishing</h2>
                </header>
                <div className="editor-panel__grid">
                  <div className="editor-field editor-field--status">
                    <span className="editor-field__label">Status</span>
                    <div className="editor-status" role="radiogroup" aria-label="Entry status">
                      <button
                        type="button"
                        className={`editor-status__pill${form.status !== 'published' ? ' is-active' : ''}`}
                        onClick={() => handleStatusChange('draft')}
                        aria-pressed={form.status !== 'published'}
                      >
                        Draft
                      </button>
                      <button
                        type="button"
                        className={`editor-status__pill${form.status === 'published' ? ' is-active' : ''}`}
                        onClick={() => handleStatusChange('published')}
                        aria-pressed={form.status === 'published'}
                      >
                        Published
                      </button>
                    </div>
                  </div>
                  <div className="editor-field">
                    <label htmlFor="entry-created" className="editor-field__label">Publish date</label>
                    <input
                      id="entry-created"
                      type="date"
                      className="editor-input"
                      value={form.createdAt}
                      onChange={(event) => handleFieldChange('createdAt', event.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className="editor-panel">
                <header className="editor-panel__header">
                  <h2>Metadata</h2>
                </header>
                <div className="editor-panel__grid">
                  <div className="editor-field">
                    <label htmlFor="entry-slug" className="editor-field__label">Slug</label>
                    <input
                      id="entry-slug"
                      type="text"
                      className="editor-input"
                      value={form.slug}
                      onChange={(event) => handleFieldChange('slug', event.target.value)}
                    />
                  </div>
                  <div className="editor-field">
                    <label htmlFor="entry-tags" className="editor-field__label">Tags</label>
                    <input
                      id="entry-tags"
                      type="text"
                      className="editor-input"
                      placeholder="ambient, installation"
                      value={tagsValue}
                      onChange={(event) => handleLocalizedFieldChange('tagsText', activeLanguage, event.target.value)}
                    />
                  </div>
                </div>
              </section>
            </div>

            <section className="editor-panel editor-panel--full">
              <header className="editor-panel__header">
                <h2>Summary</h2>
              </header>
              <div className="editor-field">
                <label htmlFor="entry-summary" className="editor-field__label sr-only">
                  Summary
                </label>
                <textarea
                  id="entry-summary"
                  className="editor-textarea"
                  rows={5}
                  value={summaryValue}
                  onChange={(event) => handleLocalizedFieldChange('summary', activeLanguage, event.target.value)}
                />
              </div>
            </section>

            <section className="editor-panel editor-panel--full">
              <header className="editor-panel__header">
                <h2>Media</h2>
              </header>
              <div className="editor-panel__grid editor-panel__grid--media">
                <div className="editor-field editor-field--cover">
                  <span className="editor-field__label">Cover image</span>
                  <Suspense fallback={<div className="uploader-loading">Loading uploader...</div>}>
                    <CoverImageUploader
                      value={form.coverImageUrl}
                      alt={coverAltValue}
                      onChange={handleCoverChange}
                    />
                  </Suspense>
                </div>
                <div className="editor-field">
                  <label htmlFor="entry-cover-alt" className="editor-field__label">Cover alt text</label>
                  <input
                    id="entry-cover-alt"
                    type="text"
                    className="editor-input"
                    value={coverAltValue}
                    onChange={(event) => handleLocalizedFieldChange('coverImageAlt', activeLanguage, event.target.value)}
                    placeholder="Describe the cover image"
                  />
                </div>
              </div>
            </section>

            <section className="editor-panel editor-panel--full">
              <header className="editor-panel__header">
                <h2>Background Image</h2>
              </header>
              <div className="editor-panel__body">
                <Suspense fallback={<div className="uploader-loading">Loading selector...</div>}>
                  <MediaSelector
                    value={form.backgroundImageUrl || ''}
                    onChange={(value) => handleFieldChange('backgroundImageUrl', value)}
                    label="Background Image"
                    placeholder="Select or paste background image URL"
                    helpText="This image will be used as the page background and fade into the footer"
                  />
                </Suspense>
              </div>
            </section>

            <section className="editor-panel editor-panel--full">
              <header className="editor-panel__header">
                <h2>Image Gallery</h2>
              </header>
              <div className="editor-panel__body">
                <div className="editor-gallery">
                  {form.galleryImages && form.galleryImages.map((image, index) => (
                    <div key={index} className="editor-gallery__item">
                      <Suspense fallback={<div className="uploader-loading">Loading selector...</div>}>
                        <MediaSelector
                          value={image}
                          onChange={(value) => {
                            const newGallery = [...form.galleryImages];
                            newGallery[index] = value;
                            handleFieldChange('galleryImages', newGallery);
                          }}
                          label={`Gallery Image ${index + 1}`}
                          placeholder="Select or paste image URL"
                        />
                      </Suspense>
                      <button
                        type="button"
                        className="admin-ghost"
                        onClick={() => {
                          const newGallery = form.galleryImages.filter((_, i) => i !== index);
                          handleFieldChange('galleryImages', newGallery);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="admin-primary"
                    onClick={() => {
                      handleFieldChange('galleryImages', [...(form.galleryImages || []), '']);
                    }}
                  >
                    Add Gallery Image
                  </button>
                </div>
              </div>
            </section>
          </div>
        </section>

        <footer className="editor-footer">
          <div className="editor-footer__status" role="status" aria-live="polite">
            {statusMessage ? <span>{statusMessage}</span> : null}
          </div>
          <div className="editor-footer__actions">
            {isEditingExisting && (
              <button type="button" className="editor-footer__button" onClick={handleDuplicate}>
                Duplicate
              </button>
            )}
            {isEditingExisting && (
              <button type="button" className="editor-footer__button editor-footer__button--danger" onClick={handleDelete}>
                Delete
              </button>
            )}
            <button
              type="button"
              className="editor-footer__button editor-footer__button--primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
