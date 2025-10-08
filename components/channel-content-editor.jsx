'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createChannelContentDefaults } from '../lib/channelContentDefaults';

function createInitialState() {
  return createChannelContentDefaults();
}

function splitParagraphs(value) {
  if (!Array.isArray(value)) return '';
  return value.join('\n\n');
}

function splitList(value) {
  if (!Array.isArray(value)) return '';
  return value.join('\n');
}

export default function ChannelContentEditor() {
  const [content, setContent] = useState(createInitialState);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/channel-content', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load channel content');
        if (ignore) return;
        setContent(data.content || createInitialState());
      } catch (error) {
        if (!ignore) setStatus(error.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const about = useMemo(() => content.about, [content]);

  const handleAboutField = useCallback((field, value) => {
    setContent((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        [field]: value
      }
    }));
  }, []);

  const handleChannelHero = useCallback((channel, field, value) => {
    setContent((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [field]: value
      }
    }));
  }, []);

  const handleAboutHistoryChange = useCallback((index, patch) => {
    setContent((prev) => {
      const history = [...prev.about.history];
      history[index] = { ...history[index], ...patch };
      return {
        ...prev,
        about: {
          ...prev.about,
          history
        }
      };
    });
  }, []);

  const addHistoryEntry = useCallback(() => {
    setContent((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        history: [...prev.about.history, { year: new Date().getFullYear().toString(), description: '' }]
      }
    }));
  }, []);

  const removeHistoryEntry = useCallback((index) => {
    setContent((prev) => {
      const history = prev.about.history.filter((_, i) => i !== index);
      return {
        ...prev,
        about: {
          ...prev.about,
          history: history.length ? history : prev.about.history
        }
      };
    });
  }, []);

  const handleSignalChange = useCallback((index, patch) => {
    setContent((prev) => {
      const signals = [...prev.about.signals];
      signals[index] = { ...signals[index], ...patch };
      return {
        ...prev,
        about: {
          ...prev.about,
          signals
        }
      };
    });
  }, []);

  const addSignal = useCallback(() => {
    setContent((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        signals: [...prev.about.signals, { term: 'New Signal', description: '' }]
      }
    }));
  }, []);

  const removeSignal = useCallback((index) => {
    setContent((prev) => {
      const signals = prev.about.signals.filter((_, i) => i !== index);
      return {
        ...prev,
        about: {
          ...prev.about,
          signals: signals.length ? signals : prev.about.signals
        }
      };
    });
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setStatus('');
      const res = await fetch('/api/channel-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      setContent(data.content || createInitialState());
      setStatus('Saved');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }, [content]);

  if (loading) {
    return (
      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Channel Copy</h2>
        </header>
        <div className="admin-panel__body">
          <p>Loading channel content…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-channel">
      <header className="admin-shell__header">
        <div>
          <h2>Channel Copy</h2>
          <p>Edit hero copy and about capsule content across public channels.</p>
        </div>
      </header>

      <div className="admin-panel">
        <header className="admin-panel__header">
          <h2>About — Overview</h2>
        </header>
        <div className="admin-panel__body admin-panel__body--grid">
          <div className="admin-field">
            <label htmlFor="about-title">Title</label>
            <input
              id="about-title"
              type="text"
              value={about.title}
              onChange={(event) => handleAboutField('title', event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="about-lead">Lead</label>
            <textarea
              id="about-lead"
              rows={4}
              value={about.lead}
              onChange={(event) => handleAboutField('lead', event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <header className="admin-panel__header">
          <h2>About — Spotlight</h2>
        </header>
        <div className="admin-panel__body admin-panel__body--grid">
          <div className="admin-field">
            <label htmlFor="about-status-label">Status label</label>
            <input
              id="about-status-label"
              type="text"
              value={about.statusLabel}
              onChange={(event) => handleAboutField('statusLabel', event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="about-status-date">Status date</label>
            <input
              id="about-status-date"
              type="date"
              value={about.statusDate}
              onChange={(event) => handleAboutField('statusDate', event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="about-tags">Tags</label>
            <input
              id="about-tags"
              type="text"
              value={about.tags}
              onChange={(event) => handleAboutField('tags', event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="about-headline">Headline</label>
            <input
              id="about-headline"
              type="text"
              value={about.headline}
              onChange={(event) => handleAboutField('headline', event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="about-summary">Summary</label>
            <textarea
              id="about-summary"
              rows={4}
              value={about.summary}
              onChange={(event) => handleAboutField('summary', event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <header className="admin-panel__header">
          <h2>About — Meta</h2>
        </header>
        <div className="admin-panel__body admin-panel__body--grid">
          <div className="admin-field">
            <label htmlFor="about-practice-vectors">Practice vectors</label>
            <textarea
              id="about-practice-vectors"
              rows={3}
              value={about.practiceVectors}
              onChange={(event) => handleAboutField('practiceVectors', event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="about-collaborators">Current collaborators</label>
            <textarea
              id="about-collaborators"
              rows={4}
              value={splitList(about.currentCollaborators)}
              onChange={(event) =>
                handleAboutField('currentCollaborators', event.target.value.split(/\n+/).map((item) => item.trim()).filter(Boolean))
              }
            />
            <small>Enter one collaborator per line.</small>
          </div>
          <div className="admin-field">
            <label htmlFor="about-operating-principles">Operating principles</label>
            <textarea
              id="about-operating-principles"
              rows={3}
              value={about.operatingPrinciples}
              onChange={(event) => handleAboutField('operatingPrinciples', event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <header className="admin-panel__header">
          <h2>About — Capsule</h2>
        </header>
        <div className="admin-panel__body admin-panel__body--grid">
          <div className="admin-field">
            <label htmlFor="about-overview">General overview</label>
            <textarea
              id="about-overview"
              rows={6}
              value={splitParagraphs(about.overview)}
              onChange={(event) =>
                handleAboutField(
                  'overview',
                  event.target.value
                    .split(/\n{2,}/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
            />
            <small>Separate paragraphs with a blank line.</small>
          </div>
        </div>

        <div className="admin-panel__body">
          <h3>Signal history</h3>
          {about.history.map((entry, index) => (
            <div key={`history-${index}`} className="admin-field">
              <div className="admin-field-row">
                <div className="admin-field">
                  <label htmlFor={`history-year-${index}`}>Year</label>
                  <input
                    id={`history-year-${index}`}
                    type="text"
                    value={entry.year}
                    onChange={(event) => handleAboutHistoryChange(index, { year: event.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor={`history-desc-${index}`}>Description</label>
                  <textarea
                    id={`history-desc-${index}`}
                    rows={3}
                    value={entry.description}
                    onChange={(event) => handleAboutHistoryChange(index, { description: event.target.value })}
                  />
                </div>
              </div>
              <div className="admin-actions">
                <div className="admin-actions__buttons">
                  <button type="button" className="admin-ghost" onClick={() => removeHistoryEntry(index)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="admin-actions">
            <div className="admin-actions__buttons">
              <button type="button" className="admin-ghost" onClick={addHistoryEntry}>
                Add history entry
              </button>
            </div>
          </div>
        </div>

        <div className="admin-panel__body">
          <h3>Studio signals</h3>
          {about.signals.map((signal, index) => (
            <div key={`signal-${index}`} className="admin-field">
              <div className="admin-field-row">
                <div className="admin-field">
                  <label htmlFor={`signal-term-${index}`}>Term</label>
                  <input
                    id={`signal-term-${index}`}
                    type="text"
                    value={signal.term}
                    onChange={(event) => handleSignalChange(index, { term: event.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor={`signal-desc-${index}`}>Description</label>
                  <textarea
                    id={`signal-desc-${index}`}
                    rows={2}
                    value={signal.description}
                    onChange={(event) => handleSignalChange(index, { description: event.target.value })}
                  />
                </div>
              </div>
              <div className="admin-actions">
                <div className="admin-actions__buttons">
                  <button type="button" className="admin-ghost" onClick={() => removeSignal(index)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="admin-actions">
            <div className="admin-actions__buttons">
              <button type="button" className="admin-ghost" onClick={addSignal}>
                Add studio signal
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <header className="admin-panel__header">
          <h2>Projects — Hero</h2>
        </header>
        <div className="admin-panel__body admin-panel__body--grid">
          <div className="admin-field">
            <label htmlFor="projects-title">Title</label>
            <input
              id="projects-title"
              type="text"
              value={content.projects.title}
              onChange={(event) => handleChannelHero('projects', 'title', event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="projects-lead">Lead</label>
            <textarea
              id="projects-lead"
              rows={3}
              value={content.projects.lead}
              onChange={(event) => handleChannelHero('projects', 'lead', event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <header className="admin-panel__header">
          <h2>Words — Hero</h2>
        </header>
        <div className="admin-panel__body admin-panel__body--grid">
          <div className="admin-field">
            <label htmlFor="words-title">Title</label>
            <input
              id="words-title"
              type="text"
              value={content.words.title}
              onChange={(event) => handleChannelHero('words', 'title', event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="words-lead">Lead</label>
            <textarea
              id="words-lead"
              rows={3}
              value={content.words.lead}
              onChange={(event) => handleChannelHero('words', 'lead', event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <header className="admin-panel__header">
          <h2>Sounds — Hero</h2>
        </header>
        <div className="admin-panel__body admin-panel__body--grid">
          <div className="admin-field">
            <label htmlFor="sounds-title">Title</label>
            <input
              id="sounds-title"
              type="text"
              value={content.sounds.title}
              onChange={(event) => handleChannelHero('sounds', 'title', event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="sounds-lead">Lead</label>
            <textarea
              id="sounds-lead"
              rows={3}
              value={content.sounds.lead}
              onChange={(event) => handleChannelHero('sounds', 'lead', event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-actions">
        {status ? <span className="admin-status">{status}</span> : null}
        <div className="admin-actions__buttons">
          <button type="button" className="admin-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save channel copy'}
          </button>
          <button type="button" className="admin-ghost" onClick={() => setContent(createInitialState())}>
            Reset to defaults
          </button>
        </div>
      </div>
    </section>
  );
}
