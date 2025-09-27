'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FIELD_DEFAULT_BASE, FIELD_DEFAULT_INFLUENCES } from '../../lib/fieldDefaults';

const TYPE_OPTIONS = [
  { id: 'projects', label: 'Projects' },
  { id: 'words', label: 'Words' },
  { id: 'sounds', label: 'Sounds' },
  { id: 'field', label: 'Field Settings' }
];

const INITIAL_CONTENT = '<p></p>';

const FIELD_BASE_CONTROLS = [
  { id: 'amplitude', label: 'Amplitude', min: 30, max: 140, step: 1 },
  { id: 'waveXFrequency', label: 'Frequency X', min: 0.05, max: 0.45, step: 0.005 },
  { id: 'waveYFrequency', label: 'Frequency Y', min: 0.05, max: 0.45, step: 0.005 },
  { id: 'swirlStrength', label: 'Swirl Strength', min: 0, max: 3, step: 0.01 },
  { id: 'swirlFrequency', label: 'Swirl Scale', min: 0.001, max: 0.02, step: 0.0005 },
  { id: 'animationSpeed', label: 'Flow Speed', min: 0.05, max: 1.2, step: 0.01 },
  { id: 'pointSize', label: 'Point Scale', min: 6, max: 32, step: 0.5 },
  { id: 'mouseInfluence', label: 'Pointer Warp', min: 0.001, max: 0.02, step: 0.0005 },
  { id: 'rippleStrength', label: 'Ripple Strength', min: 10, max: 120, step: 1 },
  { id: 'rippleSpeed', label: 'Ripple Speed', min: 120, max: 520, step: 5 },
  { id: 'rippleWidth', label: 'Ripple Width', min: 8, max: 40, step: 0.1 },
  { id: 'rippleDecay', label: 'Ripple Fade', min: 0.0005, max: 0.01, step: 0.0001 },
  { id: 'opacity', label: 'Glow', min: 0.3, max: 1, step: 0.01 },
  { id: 'brightness', label: 'Brightness', min: 0.1, max: 0.6, step: 0.01 },
  { id: 'contrast', label: 'Contrast', min: 0.6, max: 2.5, step: 0.05 },
  { id: 'fogDensity', label: 'Fog Density', min: 0.0002, max: 0.003, step: 0.0001 }
];

const FIELD_BOOLEAN_CONTROLS = [
  { id: 'autoRotate', label: 'Auto Rotate' },
  { id: 'showStats', label: 'Show Stats' }
];

const FIELD_INFLUENCE_GROUPS = [
  {
    id: 'about',
    label: 'About Channel',
    fields: [
      { id: 'mouseInfluence', label: 'Pointer Warp', min: 0.001, max: 0.02, step: 0.0005 },
      { id: 'animationSpeed', label: 'Flow Speed', min: 0.05, max: 1.2, step: 0.01 },
      { id: 'brightness', label: 'Brightness', min: 0.1, max: 0.6, step: 0.01 }
    ]
  },
  {
    id: 'projects',
    label: 'Projects Channel',
    fields: [
      { id: 'animationSpeed', label: 'Flow Speed', min: 0.05, max: 1.2, step: 0.01 },
      { id: 'swirlStrength', label: 'Swirl Strength', min: 0, max: 3, step: 0.01 },
      { id: 'pointSize', label: 'Point Scale', min: 6, max: 32, step: 0.5 }
    ]
  },
  {
    id: 'words',
    label: 'Words Channel',
    fields: [
      { id: 'animationSpeed', label: 'Flow Speed', min: 0.05, max: 1.2, step: 0.01 },
      { id: 'rippleWidth', label: 'Ripple Width', min: 8, max: 40, step: 0.1 },
      { id: 'contrast', label: 'Contrast', min: 0.6, max: 2.5, step: 0.05 }
    ]
  },
  {
    id: 'sounds',
    label: 'Sounds Channel',
    fields: [
      { id: 'rippleStrength', label: 'Ripple Strength', min: 10, max: 120, step: 1 },
      { id: 'rippleDecay', label: 'Ripple Fade', min: 0.0005, max: 0.01, step: 0.0001 },
      { id: 'mouseInfluence', label: 'Pointer Warp', min: 0.001, max: 0.02, step: 0.0005 }
    ]
  }
];

function buildDefaultFieldSettings() {
  return {
    base: { ...FIELD_DEFAULT_BASE },
    influences: Object.keys(FIELD_DEFAULT_INFLUENCES).reduce((acc, key) => {
      acc[key] = { ...FIELD_DEFAULT_INFLUENCES[key] };
      return acc;
    }, {})
  };
}

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
  const [fieldSettings, setFieldSettings] = useState(null);
  const [isSavingField, setIsSavingField] = useState(false);
  const [fieldStatus, setFieldStatus] = useState('');

  const isFieldMode = useMemo(() => activeType === 'field', [activeType]);

  const refreshEntries = useCallback(async (type) => {
    const response = await fetch(`/api/content/${type}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to load entries');
    }
    return data.entries ?? [];
  }, []);

  useEffect(() => {
    if (isFieldMode) {
      setEntries([]);
      setSelectedSlug(null);
      setForm(buildInitialForm());
      setStatusMessage('');
      return;
    }

    let ignore = false;
    (async () => {
      try {
        const items = await refreshEntries(activeType);
        if (ignore) return;
        setEntries(items);
        setSelectedSlug(null);
        setForm(buildInitialForm());
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
  }, [activeType, isFieldMode, refreshEntries]);

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
  const hasFieldData = Boolean(fieldSettings);

  const handleFieldBaseChange = useCallback((key, rawValue) => {
    setFieldSettings((prev) => {
      if (!prev || rawValue === '') return prev;
      const numeric = Number(rawValue);
      if (Number.isNaN(numeric)) return prev;
      return {
        ...prev,
        base: {
          ...prev.base,
          [key]: numeric
        }
      };
    });
  }, []);

  const handleFieldBooleanChange = useCallback((key, value) => {
    setFieldSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        base: {
          ...prev.base,
          [key]: value
        }
      };
    });
  }, []);

  const handleFieldInfluenceChange = useCallback((section, key, rawValue) => {
    setFieldSettings((prev) => {
      if (!prev || rawValue === '') return prev;
      const numeric = Number(rawValue);
      if (Number.isNaN(numeric)) return prev;
      return {
        ...prev,
        influences: {
          ...prev.influences,
          [section]: {
            ...(prev.influences?.[section] ?? {}),
            [key]: numeric
          }
        }
      };
    });
  }, []);

  const handleFieldReset = useCallback(() => {
    setFieldSettings(buildDefaultFieldSettings());
    setFieldStatus('Reset to defaults (unsaved)');
  }, []);

  const handleFieldSave = useCallback(async () => {
    if (!fieldSettings) return;
    try {
      setIsSavingField(true);
      setFieldStatus('');

      const normalizedBase = Object.entries(FIELD_DEFAULT_BASE).reduce((acc, [key, defaultValue]) => {
        const value = fieldSettings.base?.[key];
        if (typeof defaultValue === 'boolean') {
          acc[key] = typeof value === 'boolean' ? value : defaultValue;
        } else {
          acc[key] = typeof value === 'number' ? value : defaultValue;
        }
        return acc;
      }, {});

      const normalizedInfluences = Object.entries(FIELD_DEFAULT_INFLUENCES).reduce((acc, [section, defaults]) => {
        const applied = fieldSettings.influences?.[section] ?? {};
        acc[section] = Object.entries(defaults).reduce((inner, [key, defaultValue]) => {
          const value = applied[key];
          inner[key] = typeof value === 'number' ? value : defaultValue;
          return inner;
        }, {});
        return acc;
      }, {});

      const response = await fetch('/api/field-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base: normalizedBase, influences: normalizedInfluences })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to save field settings');
      }

      setFieldSettings({
        base: { ...result.base },
        influences: Object.keys(result.influences || {}).reduce((acc, key) => {
          acc[key] = { ...result.influences[key] };
          return acc;
        }, {})
      });
      setFieldStatus('Saved');
    } catch (error) {
      console.error(error);
      setFieldStatus(error.message);
    } finally {
      setIsSavingField(false);
    }
  }, [fieldSettings]);

  useEffect(() => {
    if (!isFieldMode) {
      return;
    }

    let ignore = false;
    (async () => {
      try {
        const response = await fetch('/api/field-settings', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load field settings');
        }
        if (!ignore) {
          setFieldSettings({
            base: { ...data.base },
            influences: Object.keys(data.influences || {}).reduce((acc, key) => {
              acc[key] = { ...data.influences[key] };
              return acc;
            }, {})
          });
          setFieldStatus('');
        }
      } catch (error) {
        if (!ignore) {
          console.error(error);
          setFieldStatus(error.message);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [isFieldMode]);

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

      <section className={`admin-shell__main${isFieldMode ? ' admin-shell__main--field' : ''}`}>
        {!isFieldMode && (
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
        )}

        <div className={`admin-editor-panel${isFieldMode ? ' admin-editor-panel--field' : ''}`}>
          {isFieldMode ? (
            !hasFieldData ? (
              <p className="admin-loading">Loading field settings…</p>
            ) : (
              <div className="field-settings">
                <section className="field-settings__section">
                  <header className="field-settings__header">
                    <h2>Base Field Mood</h2>
                    <p>Adjust the dotfield’s baseline behaviour. These values load with every visit.</p>
                  </header>
                  <div className="field-settings__grid">
                    {FIELD_BASE_CONTROLS.map((control) => (
                      <div key={control.id} className="admin-field field-settings__field">
                        <label htmlFor={`field-base-${control.id}`}>{control.label}</label>
                        <input
                          id={`field-base-${control.id}`}
                          type="number"
                          min={control.min}
                          max={control.max}
                          step={control.step}
                          value={fieldSettings.base?.[control.id] ?? ''}
                          onChange={(event) => handleFieldBaseChange(control.id, event.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="field-settings__toggles">
                    {FIELD_BOOLEAN_CONTROLS.map((control) => (
                      <label key={control.id} className="field-toggle">
                        <input
                          type="checkbox"
                          checked={!!fieldSettings.base?.[control.id]}
                          onChange={(event) => handleFieldBooleanChange(control.id, event.target.checked)}
                        />
                        <span>{control.label}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {FIELD_INFLUENCE_GROUPS.map((group) => (
                  <section key={group.id} className="field-settings__section">
                    <header className="field-settings__header">
                      <h3>{group.label}</h3>
                      <p>Overrides applied when visitors open this channel.</p>
                    </header>
                    <div className="field-settings__grid field-settings__grid--influence">
                      {group.fields.map((control) => (
                        <div key={`${group.id}-${control.id}`} className="admin-field field-settings__field">
                          <label htmlFor={`field-${group.id}-${control.id}`}>{control.label}</label>
                          <input
                            id={`field-${group.id}-${control.id}`}
                            type="number"
                            min={control.min}
                            max={control.max}
                            step={control.step}
                            value={fieldSettings.influences?.[group.id]?.[control.id] ?? ''}
                            onChange={(event) => handleFieldInfluenceChange(group.id, control.id, event.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                <div className="admin-actions field-settings__actions">
                  {fieldStatus && <span className="admin-status">{fieldStatus}</span>}
                  <div className="admin-actions__buttons">
                    <button type="button" className="admin-ghost" onClick={handleFieldReset}>
                      Reset Defaults
                    </button>
                    <button
                      type="button"
                      className="admin-primary"
                      onClick={handleFieldSave}
                      disabled={isSavingField}
                    >
                      {isSavingField ? 'Saving…' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <>
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
            </>
          )}
        </div>
      </section>
    </div>
  );
}
