'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { createChannelContentDefaults } from '../lib/channelContentDefaults';
import { useAdminFetch } from './admin-session-context';
import { footerPresets } from '../lib/footerSettingsGuide';

// Dynamically import the image uploader for better code splitting
const CoverImageUploader = dynamic(() => import('./cover-image-uploader'), {
  loading: () => <div className="uploader-loading">Loading uploader...</div>,
  ssr: false
});

// Import MediaSelector for simpler image selection
const MediaSelector = dynamic(() => import('./media-selector'), {
  loading: () => <div className="uploader-loading">Loading selector...</div>,
  ssr: false
});

const SECTION_LABELS = {
  about: 'About',
  projects: 'Projects',
  content: 'Content',
  sounds: 'Sounds',
  art: 'Art'
};

const ABOUT_LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' }
];

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

function parseCommaSeparatedInput(value) {
  if (typeof value !== 'string') return [];
  const parts = value.split(',').map((item) => item.trim());
  const endsWithSeparator = /,\s*$/.test(value);
  const filtered = parts.filter(Boolean);
  if (endsWithSeparator) {
    filtered.push('');
  }
  return filtered;
}

function formatHeading(sections) {
  if (sections.length === 1) {
    const label = SECTION_LABELS[sections[0]] ?? sections[0];
    return `${label} Channel Copy`;
  }
  return 'Channel Copy';
}

function formatDescription(sections) {
  if (sections.length === 1) {
    const [section] = sections;
    if (section === 'about') {
      return 'Update the about capsule hero copy, history, and studio signals.';
    }
    const label = SECTION_LABELS[section] ?? section;
    return `Edit the ${label.toLowerCase()} hero title and lead text.`;
  }
  return 'Edit hero copy and about capsule content across public channels.';
}

function resetContent(previous, sections) {
  const defaults = createInitialState();
  if (sections.length === 0 || sections.length === Object.keys(defaults).length) {
    return defaults;
  }
  const next = { ...previous };
  for (const section of sections) {
    next[section] = defaults[section];
  }
  return next;
}

// Modern fade control component with visual preview
function FadeControl({ label, value, onChange, min = 0, max = 100, step = 5, suffix = '%' }) {
  return (
    <div className="fade-control">
      <label className="fade-control__label">
        <span className="fade-control__name">{label}</span>
        <span className="fade-control__value">{value}{suffix}</span>
      </label>
      <div className="fade-control__slider-container">
        <input
          type="range"
          className="fade-control__slider"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
        />
        <div 
          className="fade-control__progress" 
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function ChannelContentEditor({ sections = ['about', 'projects', 'content', 'sounds', 'art'] }) {
  const uniqueSections = useMemo(() => Array.from(new Set(sections)), [sections]);
  const adminFetch = useAdminFetch();
  const [content, setContent] = useState(createInitialState);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aboutLanguage, setAboutLanguage] = useState('en');
  const [activeTab, setActiveTab] = useState('content'); // For tabbed interface

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await adminFetch('/api/channel-content', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load channel content');
        if (ignore) return;
        console.log('📥 Loaded channel content:', data.content);
        console.log('📥 Projects backgroundImage:', data.content?.projects?.backgroundImage);
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
  }, [adminFetch]);

  const about = useMemo(() => content.about, [content]);
  const showAbout = uniqueSections.includes('about');
  const heroSections = uniqueSections.filter((section) => section !== 'about');
  const heading = formatHeading(uniqueSections);
  const description = formatDescription(uniqueSections);
  
  // Get current section for single-section editors
  const currentSection = uniqueSections.length === 1 ? uniqueSections[0] : null;
  const rawFadeSettings = currentSection === 'about' 
    ? content.about?.aboutFooterFadeSettings 
    : content[currentSection]?.footerFadeSettings;
  
  // Ensure fade settings are numbers
  const fadeSettings = useMemo(() => {
    if (!rawFadeSettings) return null;
    return {
      bgPosition: !isNaN(parseFloat(rawFadeSettings.bgPosition)) ? parseFloat(rawFadeSettings.bgPosition) : 70,
      bgScale: rawFadeSettings.bgScale || 'cover',
      topFadeHeight: !isNaN(parseFloat(rawFadeSettings.topFadeHeight)) ? parseFloat(rawFadeSettings.topFadeHeight) : 60,
      topFadeOpacity: !isNaN(parseFloat(rawFadeSettings.topFadeOpacity)) ? parseFloat(rawFadeSettings.topFadeOpacity) : 1,
      bottomFadeHeight: !isNaN(parseFloat(rawFadeSettings.bottomFadeHeight)) ? parseFloat(rawFadeSettings.bottomFadeHeight) : 40,
      bottomFadeOpacity: !isNaN(parseFloat(rawFadeSettings.bottomFadeOpacity)) ? parseFloat(rawFadeSettings.bottomFadeOpacity) : 0.95,
      sideFadeWidth: !isNaN(parseFloat(rawFadeSettings.sideFadeWidth)) ? parseFloat(rawFadeSettings.sideFadeWidth) : 30,
      sideFadeOpacity: !isNaN(parseFloat(rawFadeSettings.sideFadeOpacity)) ? parseFloat(rawFadeSettings.sideFadeOpacity) : 0.8
    };
  }, [rawFadeSettings]);

  const handleAboutField = useCallback((field, value) => {
    setContent((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        [field]: value
      }
    }));
  }, []);

  const handleAboutLocalizedField = useCallback((field, language, value) => {
    setContent((prev) => {
      const current = prev.about[field];
      const nextField = current && typeof current === 'object' && !Array.isArray(current)
        ? { ...current, [language]: value }
        : { en: typeof current === 'string' ? current : '', ja: '', [language]: value };

      return {
        ...prev,
        about: {
          ...prev.about,
          [field]: nextField
        }
      };
    });
  }, []);

  const handleAboutTagsChange = useCallback((language, value) => {
    const parsed = parseCommaSeparatedInput(value);
    setContent((prev) => {
      const current = prev.about.aboutTags;
      const base = current && typeof current === 'object' && !Array.isArray(current)
        ? current
        : { en: Array.isArray(current) ? current : [], ja: [] };

      return {
        ...prev,
        about: {
          ...prev.about,
          aboutTags: {
            ...base,
            [language]: parsed.filter(Boolean)
          }
        }
      };
    });
  }, []);

  const handleAboutDetailCard = useCallback((index, field, language, value) => {
    setContent((prev) => {
      const cards = [...(prev.about.aboutDetailCards || [])];
      const currentCard = cards[index] || { title: { en: '', ja: '' }, text: { en: '', ja: '' } };
      const currentField = currentCard[field];
      const nextField = currentField && typeof currentField === 'object' && !Array.isArray(currentField)
        ? { ...currentField, [language]: value }
        : { en: typeof currentField === 'string' ? currentField : '', ja: '', [language]: value };

      cards[index] = { ...currentCard, [field]: nextField };

      return {
        ...prev,
        about: {
          ...prev.about,
          aboutDetailCards: cards
        }
      };
    });
  }, []);

  const addDetailCard = useCallback(() => {
    setContent((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        aboutDetailCards: [
          ...(prev.about.aboutDetailCards || []),
          {
            title: { en: 'New Section', ja: '新しいセクション' },
            text: { en: '', ja: '' }
          }
        ]
      }
    }));
  }, []);

  const removeDetailCard = useCallback((index) => {
    setContent((prev) => {
      const cards = (prev.about.aboutDetailCards || []).filter((_, i) => i !== index);
      return {
        ...prev,
        about: {
          ...prev.about,
          aboutDetailCards: cards.length ? cards : prev.about.aboutDetailCards
        }
      };
    });
  }, []);

  const handleChannelHero = useCallback((channel, field, value) => {
    console.log(`🔧 handleChannelHero called:`, { channel, field, value });
    setContent((prev) => {
      const newContent = {
        ...prev,
        [channel]: {
          ...prev[channel],
          [field]: value
        }
      };
      console.log(`🔧 New content state for ${channel}:`, newContent[channel]);
      return newContent;
    });
  }, []);

  const handleFadeSettings = useCallback((field, value) => {
    if (!currentSection) return;
    
    const fadeField = currentSection === 'about' ? 'aboutFooterFadeSettings' : 'footerFadeSettings';
    
    // Get default values from channelContentDefaults
    const defaultFadeSettings = {
      bgPosition: '70',
      bgScale: 'cover',
      topFadeHeight: '60',
      topFadeOpacity: '1',
      bottomFadeHeight: '40',
      bottomFadeOpacity: '0.95',
      sideFadeWidth: '30',
      sideFadeOpacity: '0.8'
    };
    
    setContent((prev) => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        [fadeField]: {
          ...defaultFadeSettings,
          ...(prev[currentSection]?.[fadeField] || {}),
          [field]: String(value) // Store as string to match defaults
        }
      }
    }));
  }, [currentSection]);

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
      console.log('💾 Saving channel content:', content);
      console.log('💾 Current section fade settings:', currentSection, {
        about: content.about?.aboutFooterFadeSettings,
        [currentSection]: content[currentSection]?.footerFadeSettings
      });
      const res = await adminFetch('/api/channel-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      console.log('✅ Saved response:', data.content);
      console.log('✅ Saved fade settings:', currentSection, {
        about: data.content?.about?.aboutFooterFadeSettings,
        [currentSection]: data.content?.[currentSection]?.footerFadeSettings
      });
      setContent(data.content || createInitialState());
      setStatus('Saved');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }, [adminFetch, content, currentSection]);

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
    <section className="admin-channel admin-channel--modern">
      {/* Modern Minimal Header */}
      <header className="admin-modern-header">
        <div className="admin-modern-header__content">
          <h1 className="admin-modern-header__title">{heading}</h1>
          <p className="admin-modern-header__subtitle">{description}</p>
        </div>
        
        {/* Tab Navigation for multi-section views */}
        {currentSection && (
          <nav className="admin-tabs">
            <button 
              className={`admin-tab ${activeTab === 'content' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <span className="admin-tab__label">Content</span>
            </button>
            <button 
              className={`admin-tab ${activeTab === 'appearance' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <span className="admin-tab__label">Appearance</span>
            </button>
          </nav>
        )}
      </header>

      {/* Content Tab */}
      {(!currentSection || activeTab === 'content') && (
        <>
          {showAbout ? (
            <>
              {/* Modern About Section */}
              <div className="admin-section">
                <div className="admin-section__header">
                  <h2 className="admin-section__title">Page Content</h2>
                  <div className="admin-language-switcher">
                    {ABOUT_LANGUAGES.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className={`admin-language-switcher__btn ${aboutLanguage === id ? 'is-active' : ''}`}
                        onClick={() => setAboutLanguage(id)}
                        aria-pressed={aboutLanguage === id}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
            <div className="admin-panel__body admin-panel__body--grid">
              <div className="admin-field">
                <label htmlFor="about-page-title">Page Title</label>
                <input
                  id="about-page-title"
                  type="text"
                  value={
                    about.aboutTitle && typeof about.aboutTitle === 'object'
                      ? about.aboutTitle[aboutLanguage] || ''
                      : about.aboutTitle || ''
                  }
                  onChange={(event) =>
                    handleAboutLocalizedField('aboutTitle', aboutLanguage, event.target.value)
                  }
                />
              </div>
              <div className="admin-field">
                <label htmlFor="about-page-subtitle">Subtitle</label>
                <input
                  id="about-page-subtitle"
                  type="text"
                  value={
                    about.aboutSubtitle && typeof about.aboutSubtitle === 'object'
                      ? about.aboutSubtitle[aboutLanguage] || ''
                      : about.aboutSubtitle || ''
                  }
                  onChange={(event) =>
                    handleAboutLocalizedField('aboutSubtitle', aboutLanguage, event.target.value)
                  }
                />
              </div>
              <div className="admin-field">
                <label htmlFor="about-page-content">Lead Content</label>
                <textarea
                  id="about-page-content"
                  rows={6}
                  value={
                    about.aboutContent && typeof about.aboutContent === 'object'
                      ? about.aboutContent[aboutLanguage] || ''
                      : about.aboutContent || ''
                  }
                  onChange={(event) =>
                    handleAboutLocalizedField('aboutContent', aboutLanguage, event.target.value)
                  }
                />
              </div>
              <div className="admin-field">
                <label htmlFor="about-page-tags">Tags (comma-separated)</label>
                <input
                  id="about-page-tags"
                  type="text"
                  value={(() => {
                    const tags = about.aboutTags;
                    if (tags && typeof tags === 'object' && !Array.isArray(tags)) {
                      return (tags[aboutLanguage] || []).join(', ');
                    }
                    if (Array.isArray(tags)) {
                      return tags.join(', ');
                    }
                    if (typeof tags === 'string') {
                      return tags;
                    }
                    return '';
                  })()}
                  onChange={(event) =>
                    handleAboutTagsChange(aboutLanguage, event.target.value)
                  }
                  placeholder="Designer, Composer, Systems Artist"
                />
                <small>Separate tags with commas</small>
              </div>
              <div className="admin-field admin-field--full-width">
                <Suspense fallback={<div className="uploader-loading">Loading selector...</div>}>
                  <MediaSelector
                    value={about.aboutBackgroundImage || ''}
                    onChange={(value) => handleAboutField('aboutBackgroundImage', value)}
                    label="Background Image"
                    placeholder="Select or paste background image URL"
                    helpText="This image will be used as the page background and fade into the footer"
                  />
                </Suspense>
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <header className="admin-panel__header">
              <h2>About — Detail Cards</h2>
            </header>
            <div className="admin-panel__body">
              {(about.aboutDetailCards || []).map((card, index) => (
                <div key={`detail-card-${index}`} className="admin-field">
                  <div className="admin-field-row">
                    <div className="admin-field">
                      <label htmlFor={`detail-card-title-${index}`}>Card Title</label>
                      <input
                        id={`detail-card-title-${index}`}
                        type="text"
                        value={
                          card.title && typeof card.title === 'object'
                            ? card.title[aboutLanguage] || ''
                            : card.title || ''
                        }
                        onChange={(event) =>
                          handleAboutDetailCard(index, 'title', aboutLanguage, event.target.value)
                        }
                      />
                    </div>
                    <div className="admin-field">
                      <label htmlFor={`detail-card-text-${index}`}>Card Text</label>
                      <textarea
                        id={`detail-card-text-${index}`}
                        rows={3}
                        value={
                          card.text && typeof card.text === 'object'
                            ? card.text[aboutLanguage] || ''
                            : card.text || ''
                        }
                        onChange={(event) =>
                          handleAboutDetailCard(index, 'text', aboutLanguage, event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="admin-actions">
                    <div className="admin-actions__buttons">
                      <button type="button" className="admin-ghost" onClick={() => removeDetailCard(index)}>
                        Remove Card
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="admin-actions">
                <div className="admin-actions__buttons">
                  <button type="button" className="admin-ghost" onClick={addDetailCard}>
                    Add Detail Card
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <header className="admin-panel__header">
              <h2>About — Legacy Fields (Not Displayed)</h2>
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
                    handleAboutField(
                      'currentCollaborators',
                      event.target.value.split(/\n+/).map((item) => item.trim()).filter(Boolean)
                    )
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
        </>
      ) : null}

          {heroSections.map((section) => {
            const label = SECTION_LABELS[section] ?? section;
            const titleId = `${section}-title`;
            const leadId = `${section}-lead`;
            return (
              <div className="admin-section" key={section}>
                <div className="admin-section__header">
                  <h2 className="admin-section__title">{label} Content</h2>
                </div>
                <div className="admin-section__body">
                  <div className="admin-form-grid">
                    <div className="admin-field admin-field--full">
                      <label htmlFor={titleId} className="admin-field__label">Title</label>
                      <input
                        id={titleId}
                        type="text"
                        className="admin-field__input"
                        value={content[section].title}
                        onChange={(event) => handleChannelHero(section, 'title', event.target.value)}
                      />
                    </div>
                    <div className="admin-field admin-field--full">
                      <label htmlFor={leadId} className="admin-field__label">Lead Text</label>
                      <textarea
                        id={leadId}
                        rows={3}
                        className="admin-field__textarea"
                        value={content[section].lead}
                        onChange={(event) => handleChannelHero(section, 'lead', event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Appearance Tab */}
      {currentSection && activeTab === 'appearance' && (
        <div className="admin-appearance-tab">
          {/* Background Image Section */}
          <div className="admin-section">
            <div className="admin-section__header">
              <h2 className="admin-section__title">Background Image</h2>
              <p className="admin-section__description">
                This image will fade into the footer with customizable gradients
              </p>
            </div>
            <div className="admin-section__body">
              <Suspense fallback={<div className="uploader-loading">Loading selector...</div>}>
                <MediaSelector
                  value={
                    currentSection === 'about' 
                      ? content.about?.aboutBackgroundImage || ''
                      : content[currentSection]?.backgroundImage || ''
                  }
                  onChange={(value) => {
                    if (currentSection === 'about') {
                      handleAboutField('aboutBackgroundImage', value);
                    } else {
                      handleChannelHero(currentSection, 'backgroundImage', value);
                    }
                  }}
                  label="Background Image"
                  placeholder="Select or paste background image URL"
                  helpText="Upload images via the Media page, then select here"
                />
              </Suspense>
            </div>
          </div>

          {/* Fade Controls Section */}
          <div className="admin-section">
            <div className="admin-section__header">
              <h2 className="admin-section__title">Footer Background Settings</h2>
              <p className="admin-section__description">
                Control how the background image appears in the footer - full bleed, artistic fade, or showcase mode
              </p>
            </div>
            <div className="admin-section__body">
              {/* Presets Section */}
              <div className="admin-presets-section">
                <h3 className="admin-subsection__title">Quick Presets</h3>
                <div className="preset-buttons">
                  {Object.entries(footerPresets).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      className="preset-button"
                      onClick={() => {
                        Object.entries(preset.settings).forEach(([field, value]) => {
                          handleFadeSettings(field, value);
                        });
                        setStatus(`Applied "${preset.name}" preset`);
                        setTimeout(() => setStatus(''), 3000);
                      }}
                      title={preset.description}
                    >
                      <span className="preset-button__name">{preset.name}</span>
                      <span className="preset-button__desc">{preset.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="fade-controls-grid">
                {/* Image Position & Scale */}
                <div className="fade-control-group">
                  <h3 className="fade-control-group__title">Image Position & Scale</h3>
                  
                  {/* Position Control */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="fade-control__label">
                      <span className="fade-control__name">Vertical Position</span>
                    </label>
                    <select
                      className="admin-field__select"
                      value={fadeSettings?.bgPosition ?? 'bottom'}
                      onChange={(e) => handleFadeSettings('bgPosition', e.target.value)}
                      style={{ marginTop: '0.5rem', width: '100%' }}
                    >
                      <option value="bottom">Bottom (horizon/ground aligned)</option>
                      <option value="center">Center (vertically centered)</option>
                      <option value="top">Top (sky/ceiling aligned)</option>
                      <option value="0">0% - Full Bottom</option>
                      <option value="25">25% - Lower Third</option>
                      <option value="50">50% - Middle</option>
                      <option value="75">75% - Upper Third</option>
                      <option value="100">100% - Full Top</option>
                    </select>
                    <small className="fade-control__help">
                      Use "Bottom" for horizon images like the space shuttle
                    </small>
                  </div>

                  {/* Scale Control */}
                  <div>
                    <label className="fade-control__label">
                      <span className="fade-control__name">Scale Mode</span>
                    </label>
                    <select
                      className="admin-field__select"
                      value={fadeSettings?.bgScale ?? 'cover'}
                      onChange={(e) => handleFadeSettings('bgScale', e.target.value)}
                      style={{ marginTop: '0.5rem', width: '100%' }}
                    >
                      <option value="cover">Cover - Fills entire width (may crop)</option>
                      <option value="contain">Contain - Shows entire image (may have gaps)</option>
                      <option value="auto">Auto - Original size</option>
                    </select>
                    <small className="fade-control__help">
                      Use "Cover" for full-bleed hero images, "Contain" to show artwork entirely
                    </small>
                  </div>
                </div>

                {/* Top Fade */}
                <div className="fade-control-group">
                  <h3 className="fade-control-group__title">Top Fade</h3>
                  <FadeControl
                    label="Fade Height"
                    value={fadeSettings?.topFadeHeight ?? 60}
                    onChange={(value) => handleFadeSettings('topFadeHeight', value)}
                    min={0}
                    max={100}
                    step={5}
                    suffix="%"
                  />
                  <FadeControl
                    label="Fade Intensity"
                    value={(fadeSettings?.topFadeOpacity ?? 1) * 100}
                    onChange={(value) => handleFadeSettings('topFadeOpacity', value / 100)}
                    min={0}
                    max={100}
                    step={5}
                    suffix="%"
                  />
                </div>

                {/* Bottom Fade */}
                <div className="fade-control-group">
                  <h3 className="fade-control-group__title">Bottom Fade</h3>
                  <FadeControl
                    label="Fade Height"
                    value={fadeSettings?.bottomFadeHeight ?? 40}
                    onChange={(value) => handleFadeSettings('bottomFadeHeight', value)}
                    min={0}
                    max={100}
                    step={5}
                    suffix="%"
                  />
                  <FadeControl
                    label="Fade Intensity"
                    value={(fadeSettings?.bottomFadeOpacity ?? 0.95) * 100}
                    onChange={(value) => handleFadeSettings('bottomFadeOpacity', value / 100)}
                    min={0}
                    max={100}
                    step={5}
                    suffix="%"
                  />
                </div>

                {/* Side Fade */}
                <div className="fade-control-group">
                  <h3 className="fade-control-group__title">Side Fade</h3>
                  <FadeControl
                    label="Fade Width"
                    value={fadeSettings?.sideFadeWidth ?? 30}
                    onChange={(value) => handleFadeSettings('sideFadeWidth', value)}
                    min={0}
                    max={50}
                    step={5}
                    suffix="%"
                  />
                  <FadeControl
                    label="Fade Intensity"
                    value={(fadeSettings?.sideFadeOpacity ?? 0.8) * 100}
                    onChange={(value) => handleFadeSettings('sideFadeOpacity', value / 100)}
                    min={0}
                    max={100}
                    step={5}
                    suffix="%"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visual Preview */}
          <div className="admin-section">
            <div className="admin-section__header">
              <h2 className="admin-section__title">Live Preview</h2>
              <p className="admin-section__description">
                See how your settings will look in the footer
              </p>
            </div>
            <div className="admin-section__body">
              <div className="footer-preview">
                <div 
                  className="footer-preview__container"
                  style={{
                    backgroundImage: currentSection === 'about' && content.about?.aboutBackgroundImage 
                      ? `url(${content.about.aboutBackgroundImage})` 
                      : content[currentSection]?.backgroundImage 
                        ? `url(${content[currentSection].backgroundImage})` 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: fadeSettings?.bgScale || 'cover',
                    backgroundPosition: `center ${fadeSettings?.bgPosition || 'bottom'}`,
                    backgroundRepeat: 'no-repeat',
                    position: 'relative',
                    height: '300px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#000',
                  }}
                >
                  {/* Top fade overlay */}
                  {fadeSettings?.topFadeHeight > 0 && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: `${fadeSettings.topFadeHeight}%`,
                        background: `linear-gradient(to bottom, rgba(0,0,0,${fadeSettings.topFadeOpacity || 0}) 0%, transparent 100%)`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  {/* Bottom fade overlay */}
                  {fadeSettings?.bottomFadeHeight > 0 && (
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${fadeSettings.bottomFadeHeight}%`,
                        background: `linear-gradient(to top, rgba(0,0,0,${fadeSettings.bottomFadeOpacity || 0}) 0%, transparent 100%)`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  {/* Side fade overlays */}
                  {fadeSettings?.sideFadeWidth > 0 && (
                    <>
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          bottom: 0,
                          width: `${fadeSettings.sideFadeWidth}%`,
                          background: `linear-gradient(to right, rgba(0,0,0,${fadeSettings.sideFadeOpacity || 0}) 0%, transparent 100%)`,
                          pointerEvents: 'none',
                        }}
                      />
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bottom: 0,
                          width: `${fadeSettings.sideFadeWidth}%`,
                          background: `linear-gradient(to left, rgba(0,0,0,${fadeSettings.sideFadeOpacity || 0}) 0%, transparent 100%)`,
                          pointerEvents: 'none',
                        }}
                      />
                    </>
                  )}
                  {/* Sample content */}
                  <div style={{
                    position: 'absolute',
                    bottom: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    color: 'white',
                    zIndex: 2,
                  }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>Footer Content Preview</div>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1rem' }}>📧</span>
                      <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>your@email.com</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>WORK WITH ME</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-actions">
        {status ? <span className="admin-status">{status}</span> : null}
        <div className="admin-actions__buttons">
          <button type="button" className="admin-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save channel copy'}
          </button>
          <button
            type="button"
            className="admin-ghost"
            onClick={() => setContent((prev) => resetContent(prev, uniqueSections))}
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </section>
  );
}