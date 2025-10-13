'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminFetch } from '@/components/admin-session-context';

const DEFAULT_PAGE_NAMES = ['home', 'about', 'projects', 'content', 'sounds', 'art'];

function parseKeywordInput(value) {
  if (typeof value !== 'string') return [];
  const parts = value.split(',').map((item) => item.trim());
  const endsWithSeparator = /,\s*$/.test(value);
  const filtered = parts.filter(Boolean);
  if (endsWithSeparator) {
    filtered.push('');
  }
  return filtered;
}

export default function SeoSettingsPage() {
  const adminFetch = useAdminFetch();
  const [config, setConfig] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState('global');
  const [activePage, setActivePage] = useState('home');

  // Load SEO configuration
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const response = await adminFetch('/api/seo');
        const data = await response.json();
        if (!ignore) {
          setConfig(data.config);
        }
      } catch (error) {
        console.error('Error loading SEO config:', error);
        setStatusMessage('Failed to load SEO configuration');
      }
    })();
    return () => { ignore = true; };
  }, [adminFetch]);

  const handleGlobalChange = useCallback((field, value) => {
    setConfig(prev => ({
      ...prev,
      global: {
        ...prev.global,
        [field]: value
      }
    }));
  }, []);

  const handleOpenGraphChange = useCallback((field, value) => {
    setConfig(prev => ({
      ...prev,
      openGraph: {
        ...prev.openGraph,
        [field]: value
      }
    }));
  }, []);

  const handleTwitterChange = useCallback((field, value) => {
    setConfig(prev => ({
      ...prev,
      twitter: {
        ...prev.twitter,
        [field]: value
      }
    }));
  }, []);

  const handleRobotsChange = useCallback((field, value) => {
    setConfig(prev => ({
      ...prev,
      robots: {
        ...prev.robots,
        [field]: value
      }
    }));
  }, []);

  const handleVerificationChange = useCallback((field, value) => {
    setConfig(prev => ({
      ...prev,
      verification: {
        ...prev.verification,
        [field]: value
      }
    }));
  }, []);

  const handlePageChange = useCallback((page, field, value) => {
    setConfig(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [page]: {
          ...prev.pages?.[page],
          [field]: value
        }
      }
    }));
  }, []);

  const handleTemplateChange = useCallback((type, field, value) => {
    setConfig(prev => ({
      ...prev,
      contentTemplates: {
        ...prev.contentTemplates,
        [type]: {
          ...prev.contentTemplates?.[type],
          [field]: value
        }
      }
    }));
  }, []);

  const handleArrayChange = useCallback((field, value) => {
    const arrayValue = parseKeywordInput(value);
    setConfig(prev => ({
      ...prev,
      global: {
        ...prev.global,
        [field]: arrayValue
      }
    }));
  }, []);

  const handlePageArrayChange = useCallback((page, field, value) => {
    const arrayValue = parseKeywordInput(value);
    handlePageChange(page, field, arrayValue);
  }, [handlePageChange]);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      setStatusMessage('');

      const response = await adminFetch('/api/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Save failed');
      }

      setConfig(result.config);
      setStatusMessage('SEO configuration saved successfully');
    } catch (error) {
      console.error('Error saving SEO config:', error);
      setStatusMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }, [adminFetch, config]);

  if (!config) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">Loading SEO configuration...</div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <div>
          <h1>SEO Settings</h1>
          <p>Manage search engine optimization settings for your site.</p>
        </div>
        <div className="admin-actions">
          <div className="admin-workspace__status" role="status" aria-live="polite">
            {statusMessage && <span className="admin-status">{statusMessage}</span>}
          </div>
          <button 
            type="button" 
            className="admin-primary" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'global' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('global')}
        >
          Global Settings
        </button>
        <button
          className={`admin-tab ${activeTab === 'pages' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('pages')}
        >
          Page SEO
        </button>
        <button
          className={`admin-tab ${activeTab === 'social' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          Social Media
        </button>
        <button
          className={`admin-tab ${activeTab === 'technical' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('technical')}
        >
          Technical SEO
        </button>
        <button
          className={`admin-tab ${activeTab === 'templates' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Content Templates
        </button>
      </nav>

      <section className="admin-workspace">
        {activeTab === 'global' && (
          <div className="admin-panel">
            <header className="admin-panel__header">
              <h2>Global SEO Settings</h2>
            </header>
            <div className="admin-panel__body admin-panel__body--grid">
              <div className="admin-field">
                <label htmlFor="siteName">Site Name</label>
                <input
                  id="siteName"
                  type="text"
                  value={config.global?.siteName || ''}
                  onChange={(e) => handleGlobalChange('siteName', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="siteUrl">Site URL</label>
                <input
                  id="siteUrl"
                  type="url"
                  value={config.global?.siteUrl || ''}
                  onChange={(e) => handleGlobalChange('siteUrl', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="titleTemplate">Title Template</label>
                <input
                  id="titleTemplate"
                  type="text"
                  value={config.global?.titleTemplate || ''}
                  onChange={(e) => handleGlobalChange('titleTemplate', e.target.value)}
                  placeholder="%s | Site Name"
                />
                <small>Use %s as placeholder for page title</small>
              </div>

              <div className="admin-field">
                <label htmlFor="defaultTitle">Default Title</label>
                <input
                  id="defaultTitle"
                  type="text"
                  value={config.global?.defaultTitle || ''}
                  onChange={(e) => handleGlobalChange('defaultTitle', e.target.value)}
                />
              </div>

              <div className="admin-field admin-field--full">
                <label htmlFor="defaultDescription">Default Description</label>
                <textarea
                  id="defaultDescription"
                  rows={3}
                  value={config.global?.defaultDescription || ''}
                  onChange={(e) => handleGlobalChange('defaultDescription', e.target.value)}
                />
              </div>

              <div className="admin-field admin-field--full">
                <label htmlFor="keywords">Keywords</label>
                <input
                  id="keywords"
                  type="text"
                  value={config.global?.keywords?.join(', ') || ''}
                  onChange={(e) => handleArrayChange('keywords', e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                />
                <small>Comma-separated list of keywords</small>
              </div>

              <div className="admin-field">
                <label htmlFor="author">Author</label>
                <input
                  id="author"
                  type="text"
                  value={config.global?.author || ''}
                  onChange={(e) => handleGlobalChange('author', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="locale">Locale</label>
                <input
                  id="locale"
                  type="text"
                  value={config.global?.locale || ''}
                  onChange={(e) => handleGlobalChange('locale', e.target.value)}
                  placeholder="en_US"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="defaultImage">Default OG Image</label>
                <input
                  id="defaultImage"
                  type="text"
                  value={config.global?.defaultImage || ''}
                  onChange={(e) => handleGlobalChange('defaultImage', e.target.value)}
                  placeholder="/og-default.jpg"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="favicon">Favicon Path</label>
                <input
                  id="favicon"
                  type="text"
                  value={config.global?.favicon || ''}
                  onChange={(e) => handleGlobalChange('favicon', e.target.value)}
                  placeholder="/favicon.ico"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="themeColor">Theme Color</label>
                <input
                  id="themeColor"
                  type="color"
                  value={config.global?.themeColor || '#000000'}
                  onChange={(e) => handleGlobalChange('themeColor', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="backgroundColor">Background Color</label>
                <input
                  id="backgroundColor"
                  type="color"
                  value={config.global?.backgroundColor || '#000000'}
                  onChange={(e) => handleGlobalChange('backgroundColor', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="admin-panel">
            <header className="admin-panel__header">
              <h2>Page-Specific SEO</h2>
            </header>
            
            <nav className="admin-submenu">
              {DEFAULT_PAGE_NAMES.map(page => (
                <button
                  key={page}
                  className={`admin-submenu-item ${activePage === page ? 'is-active' : ''}`}
                  onClick={() => setActivePage(page)}
                >
                  {page.charAt(0).toUpperCase() + page.slice(1)}
                </button>
              ))}
            </nav>

            <div className="admin-panel__body admin-panel__body--grid">
              <div className="admin-field admin-field--full">
                <label htmlFor={`${activePage}-title`}>Title</label>
                <input
                  id={`${activePage}-title`}
                  type="text"
                  value={config.pages?.[activePage]?.title || ''}
                  onChange={(e) => handlePageChange(activePage, 'title', e.target.value)}
                />
              </div>

              <div className="admin-field admin-field--full">
                <label htmlFor={`${activePage}-description`}>Description</label>
                <textarea
                  id={`${activePage}-description`}
                  rows={3}
                  value={config.pages?.[activePage]?.description || ''}
                  onChange={(e) => handlePageChange(activePage, 'description', e.target.value)}
                />
              </div>

              <div className="admin-field admin-field--full">
                <label htmlFor={`${activePage}-keywords`}>Keywords</label>
                <input
                  id={`${activePage}-keywords`}
                  type="text"
                  value={config.pages?.[activePage]?.keywords?.join(', ') || ''}
                  onChange={(e) => handlePageArrayChange(activePage, 'keywords', e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                />
                <small>Comma-separated list of page-specific keywords</small>
              </div>

              <div className="admin-field admin-field--full">
                <label htmlFor={`${activePage}-image`}>OG Image</label>
                <input
                  id={`${activePage}-image`}
                  type="text"
                  value={config.pages?.[activePage]?.image || ''}
                  onChange={(e) => handlePageChange(activePage, 'image', e.target.value)}
                  placeholder="/og-page.jpg"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <>
            <div className="admin-panel">
              <header className="admin-panel__header">
                <h2>Open Graph Settings</h2>
              </header>
              <div className="admin-panel__body admin-panel__body--grid">
                <div className="admin-field">
                  <label htmlFor="ogType">Default Type</label>
                  <select
                    id="ogType"
                    value={config.openGraph?.type || 'website'}
                    onChange={(e) => handleOpenGraphChange('type', e.target.value)}
                  >
                    <option value="website">Website</option>
                    <option value="article">Article</option>
                    <option value="profile">Profile</option>
                    <option value="video">Video</option>
                    <option value="music">Music</option>
                  </select>
                </div>

                <div className="admin-field">
                  <label htmlFor="ogLocale">Locale</label>
                  <input
                    id="ogLocale"
                    type="text"
                    value={config.openGraph?.locale || ''}
                    onChange={(e) => handleOpenGraphChange('locale', e.target.value)}
                    placeholder="en_US"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="ogSiteName">Site Name</label>
                  <input
                    id="ogSiteName"
                    type="text"
                    value={config.openGraph?.siteName || ''}
                    onChange={(e) => handleOpenGraphChange('siteName', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="admin-panel">
              <header className="admin-panel__header">
                <h2>Twitter Card Settings</h2>
              </header>
              <div className="admin-panel__body admin-panel__body--grid">
                <div className="admin-field">
                  <label htmlFor="twitterCard">Card Type</label>
                  <select
                    id="twitterCard"
                    value={config.twitter?.cardType || 'summary_large_image'}
                    onChange={(e) => handleTwitterChange('cardType', e.target.value)}
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary Large Image</option>
                    <option value="app">App</option>
                    <option value="player">Player</option>
                  </select>
                </div>

                <div className="admin-field">
                  <label htmlFor="twitterSite">Site Handle</label>
                  <input
                    id="twitterSite"
                    type="text"
                    value={config.twitter?.site || ''}
                    onChange={(e) => handleTwitterChange('site', e.target.value)}
                    placeholder="@username"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="twitterCreator">Creator Handle</label>
                  <input
                    id="twitterCreator"
                    type="text"
                    value={config.twitter?.creator || ''}
                    onChange={(e) => handleTwitterChange('creator', e.target.value)}
                    placeholder="@username"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="twitterHandle">Default Handle</label>
                  <input
                    id="twitterHandle"
                    type="text"
                    value={config.twitter?.handle || ''}
                    onChange={(e) => handleTwitterChange('handle', e.target.value)}
                    placeholder="@username"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'technical' && (
          <>
            <div className="admin-panel">
              <header className="admin-panel__header">
                <h2>Robots Configuration</h2>
              </header>
              <div className="admin-panel__body admin-panel__body--grid">
                <div className="admin-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.robots?.index !== false}
                      onChange={(e) => handleRobotsChange('index', e.target.checked)}
                    />
                    Allow Indexing
                  </label>
                </div>

                <div className="admin-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.robots?.follow !== false}
                      onChange={(e) => handleRobotsChange('follow', e.target.checked)}
                    />
                    Follow Links
                  </label>
                </div>
              </div>
            </div>

            <div className="admin-panel">
              <header className="admin-panel__header">
                <h2>Site Verification</h2>
              </header>
              <div className="admin-panel__body admin-panel__body--grid">
                <div className="admin-field">
                  <label htmlFor="googleVerification">Google Search Console</label>
                  <input
                    id="googleVerification"
                    type="text"
                    value={config.verification?.google || ''}
                    onChange={(e) => handleVerificationChange('google', e.target.value)}
                    placeholder="Verification code"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="bingVerification">Bing Webmaster Tools</label>
                  <input
                    id="bingVerification"
                    type="text"
                    value={config.verification?.bing || ''}
                    onChange={(e) => handleVerificationChange('bing', e.target.value)}
                    placeholder="Verification code"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="yandexVerification">Yandex</label>
                  <input
                    id="yandexVerification"
                    type="text"
                    value={config.verification?.yandex || ''}
                    onChange={(e) => handleVerificationChange('yandex', e.target.value)}
                    placeholder="Verification code"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="pinterestVerification">Pinterest</label>
                  <input
                    id="pinterestVerification"
                    type="text"
                    value={config.verification?.pinterest || ''}
                    onChange={(e) => handleVerificationChange('pinterest', e.target.value)}
                    placeholder="Verification code"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'templates' && (
          <div className="admin-panel">
            <header className="admin-panel__header">
              <h2>Content Templates</h2>
              <p>Define SEO templates for dynamic content types</p>
            </header>
            
            <div className="admin-section">
              <h3>Projects Template</h3>
              <div className="admin-panel__body admin-panel__body--grid">
                <div className="admin-field admin-field--full">
                  <label htmlFor="projectsTitleTemplate">Title Template</label>
                  <input
                    id="projectsTitleTemplate"
                    type="text"
                    value={config.contentTemplates?.projects?.titleTemplate || ''}
                    onChange={(e) => handleTemplateChange('projects', 'titleTemplate', e.target.value)}
                    placeholder="%s - Project | Site Name"
                  />
                  <small>Use %s as placeholder for content title</small>
                </div>

                <div className="admin-field admin-field--full">
                  <label htmlFor="projectsDescTemplate">Description Template</label>
                  <input
                    id="projectsDescTemplate"
                    type="text"
                    value={config.contentTemplates?.projects?.descriptionTemplate || ''}
                    onChange={(e) => handleTemplateChange('projects', 'descriptionTemplate', e.target.value)}
                    placeholder="Project: %s"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="projectsType">OG Type</label>
                  <input
                    id="projectsType"
                    type="text"
                    value={config.contentTemplates?.projects?.type || ''}
                    onChange={(e) => handleTemplateChange('projects', 'type', e.target.value)}
                    placeholder="article"
                  />
                </div>
              </div>
            </div>

            <div className="admin-section">
              <h3>Content Template</h3>
              <div className="admin-panel__body admin-panel__body--grid">
                <div className="admin-field admin-field--full">
                  <label htmlFor="contentTitleTemplate">Title Template</label>
                  <input
                    id="contentTitleTemplate"
                    type="text"
                    value={config.contentTemplates?.content?.titleTemplate || ''}
                    onChange={(e) => handleTemplateChange('content', 'titleTemplate', e.target.value)}
                    placeholder="%s - Content | Site Name"
                  />
                </div>

                <div className="admin-field admin-field--full">
                  <label htmlFor="contentDescTemplate">Description Template</label>
                  <input
                    id="contentDescTemplate"
                    type="text"
                    value={config.contentTemplates?.content?.descriptionTemplate || ''}
                    onChange={(e) => handleTemplateChange('content', 'descriptionTemplate', e.target.value)}
                    placeholder="%s"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="contentType">OG Type</label>
                  <input
                    id="contentType"
                    type="text"
                    value={config.contentTemplates?.content?.type || ''}
                    onChange={(e) => handleTemplateChange('content', 'type', e.target.value)}
                    placeholder="article"
                  />
                </div>
              </div>
            </div>

            <div className="admin-section">
              <h3>Sounds Template</h3>
              <div className="admin-panel__body admin-panel__body--grid">
                <div className="admin-field admin-field--full">
                  <label htmlFor="soundsTitleTemplate">Title Template</label>
                  <input
                    id="soundsTitleTemplate"
                    type="text"
                    value={config.contentTemplates?.sounds?.titleTemplate || ''}
                    onChange={(e) => handleTemplateChange('sounds', 'titleTemplate', e.target.value)}
                    placeholder="%s - Sound | Site Name"
                  />
                </div>

                <div className="admin-field admin-field--full">
                  <label htmlFor="soundsDescTemplate">Description Template</label>
                  <input
                    id="soundsDescTemplate"
                    type="text"
                    value={config.contentTemplates?.sounds?.descriptionTemplate || ''}
                    onChange={(e) => handleTemplateChange('sounds', 'descriptionTemplate', e.target.value)}
                    placeholder="Sound piece: %s"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="soundsType">OG Type</label>
                  <input
                    id="soundsType"
                    type="text"
                    value={config.contentTemplates?.sounds?.type || ''}
                    onChange={(e) => handleTemplateChange('sounds', 'type', e.target.value)}
                    placeholder="music"
                  />
                </div>
              </div>
            </div>

            <div className="admin-section">
              <h3>Art Template</h3>
              <div className="admin-panel__body admin-panel__body--grid">
                <div className="admin-field admin-field--full">
                  <label htmlFor="artTitleTemplate">Title Template</label>
                  <input
                    id="artTitleTemplate"
                    type="text"
                    value={config.contentTemplates?.art?.titleTemplate || ''}
                    onChange={(e) => handleTemplateChange('art', 'titleTemplate', e.target.value)}
                    placeholder="%s - Art | Site Name"
                  />
                </div>

                <div className="admin-field admin-field--full">
                  <label htmlFor="artDescTemplate">Description Template</label>
                  <input
                    id="artDescTemplate"
                    type="text"
                    value={config.contentTemplates?.art?.descriptionTemplate || ''}
                    onChange={(e) => handleTemplateChange('art', 'descriptionTemplate', e.target.value)}
                    placeholder="Art study: %s"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="artType">OG Type</label>
                  <input
                    id="artType"
                    type="text"
                    value={config.contentTemplates?.art?.type || ''}
                    onChange={(e) => handleTemplateChange('art', 'type', e.target.value)}
                    placeholder="article"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
