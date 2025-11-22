'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ProjectListItem from '../../components/ProjectListItem';
import { useLanguage } from '../../contexts/LanguageContext';
import { t, getLocalizedContent, getLocalizedTags } from '../../lib/translations';
import EntryReturnFocus from '../../components/EntryReturnFocus';
import { ENTRY_RETURN_STORAGE_KEY } from '../../lib/entryReturn';

const PROJECT_TONES = {
  'signal-grid': 'cyan',
  'resonant-atlas': 'amber',
  'signal-bloom': 'magenta'
};

export default function ProjectsContent({ entries, hero }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Container ref kept in case future measurements are needed
  const containerRef = useRef(null);
  const { language } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  
  const backgroundImage = hero.backgroundImage || '';
  
  // DEBUG: Log what we're receiving
  useEffect(() => {
    console.log('🔍 ProjectsContent Debug:', {
      hero,
      backgroundImage,
      hasBackgroundImage: Boolean(backgroundImage),
      backgroundImageLength: backgroundImage?.length
    });
  }, [hero, backgroundImage]);
  
  const CATEGORIES = useMemo(() => (
    [
      { id: 'all', key: 'projects.all' },
      { id: 'useful-tools', key: 'projects.useful-tools' },
      { id: 'fun', key: 'projects.fun' },
      { id: 'events', key: 'projects.events' },
      { id: 'startups', key: 'projects.startups' }
    ]
  ), []);
  
  // Get initial category from URL or default to 'All'
  const initialCategory = (searchParams.get('category') || 'all').toLowerCase();
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  
  // Set loaded state on mount
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    setIsLoaded(true);
    if (process.env.NODE_ENV === 'development') {
      try {
        const raw = sessionStorage.getItem(ENTRY_RETURN_STORAGE_KEY);
        console.log('[ProjectsContent] mount', {
          urlCategory: searchParams.get('category') || null,
          initialCategory,
          selectedCategory,
          returnPayload: raw ? JSON.parse(raw) : null,
        });
      } catch (e) {
        console.log('[ProjectsContent] mount (no storage access)', e?.message);
      }
    }
  }, [initialCategory, searchParams, selectedCategory]);
  
  // Restore previously selected category (but DO NOT auto-scroll).
  // We intentionally removed the older scroll restoration by raw Y offset
  // because it could apply on a cold load and jump the page, hiding the header.
  // Instead, scroll restoration is handled by EntryReturnFocus using a slug anchor.
  const didRestoreCategoryRef = useRef(false);
  useEffect(() => {
    if (didRestoreCategoryRef.current) return;
    try {
      const hasUrlCategory = !!searchParams.get('category');
      const storedCategory = hasUrlCategory ? null : sessionStorage.getItem('projectsSelectedCategory');
      if (storedCategory && storedCategory !== selectedCategory) {
        const normalized = storedCategory.toLowerCase();
        if (CATEGORIES.some((item) => item.id === normalized)) {
          setSelectedCategory(normalized);
        }
      }
      // Only clear category if we actually consumed it; otherwise leave
      // so other navigations (e.g., back/forward) can also restore.
    } catch {
      // Ignore storage errors safely (private mode, etc.)
    }
    didRestoreCategoryRef.current = true;
  }, [CATEGORIES, searchParams, selectedCategory]);
  
  // Update URL when category changes
  const handleCategoryChange = (category) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProjectsContent] handleCategoryChange', {
        from: selectedCategory,
        to: category
      });
    }
    setSelectedCategory(category);
    const params = new URLSearchParams(searchParams);
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  };
  
  // Persist the currently selected category so the list view is consistent
  // when the user returns from a detail page, regardless of navigation method.
  useEffect(() => {
    try {
      sessionStorage.setItem('projectsSelectedCategory', selectedCategory);
    } catch {
      // Ignore storage errors
    }
  }, [selectedCategory]);

  // Auto-categorize entries based on tags, title, or content
  const categorizedEntries = useMemo(() => {
    return entries.map(entry => {
      let category = 'useful-tools'; // Default

      const titleEn = getLocalizedContent(entry.title, 'en') || '';
      const contentEn = getLocalizedContent(entry.content, 'en') || '';
      const lowerTitle = titleEn.toLowerCase();
      const lowerTags = getLocalizedTags(entry.tags, 'en').map((tag) => tag.toLowerCase());
      const lowerContent = contentEn.toLowerCase();
      
      // Check for Startups
      if (lowerTags.includes('saas') || 
          lowerTags.includes('startup') ||
          lowerTitle.includes('makeleaps') ||
          lowerContent.includes('bootstrapped') ||
          lowerContent.includes('company') ||
          lowerContent.includes('platform')) {
        category = 'startups';
      }
      // Check for Fun projects
      else if (lowerTags.includes('game') || 
               lowerTags.includes('satire') ||
               lowerTitle.includes('durwhirl') ||
               lowerTitle.includes('battle') ||
               lowerTitle.includes('simulator') ||
               lowerContent.includes('game') ||
               lowerContent.includes('play')) {
        category = 'fun';
      }
      // Check for Events
      else if (lowerTags.includes('event') || 
               lowerTags.includes('conference') ||
               lowerContent.includes('event') ||
               lowerContent.includes('conference')) {
        category = 'events';
      }
      // Check for Useful Tools
      else if (lowerTags.includes('tool') || 
               lowerTags.includes('tooling') ||
               lowerTags.includes('utility') ||
               lowerTitle.includes('generator') ||
               lowerTitle.includes('builder') ||
               lowerContent.includes('tool')) {
        category = 'useful-tools';
      }
      
      return {
        ...entry,
        category
      };
    });
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (selectedCategory === 'all') return categorizedEntries;
    return categorizedEntries.filter(entry => entry.category === selectedCategory);
  }, [categorizedEntries, selectedCategory]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    console.log('[ProjectsContent] filter diagnostics', {
      category: selectedCategory,
      totalEntries: entries.length,
      categorizedSlugs: entries.map((entry) => entry.slug),
      filteredSlugs: filteredEntries.map((entry) => entry.slug),
      filteredCount: filteredEntries.length
    });
  }, [entries, filteredEntries, selectedCategory]);

  return (
    <section className={`channel channel--projects ${isLoaded ? 'is-loaded' : ''} ${backgroundImage ? 'has-background-image' : ''}`} ref={containerRef}>
      {backgroundImage && (
        <div className="channel__background">
          <img 
            src={backgroundImage} 
            alt="" 
            className="channel__background-image"
            aria-hidden="true"
          />
          <div className="channel__gradient" />
        </div>
      )}
      <header className="channel__intro">
        <h1 className="channel__title">{getLocalizedContent(hero.title, language) || t('projects.title', language)}</h1>
        <p className="channel__lead">{getLocalizedContent(hero.lead, language)}</p>
        
        <div className="channel__categories">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              className={`channel__category-btn ${selectedCategory === category.id ? 'channel__category-btn--active' : ''}`}
              onClick={() => handleCategoryChange(category.id)}
              aria-pressed={selectedCategory === category.id}
            >
              {t(category.key, language)}
              {category.id !== 'all' && (
                <span className="channel__category-count">
                  {categorizedEntries.filter(e => e.category === category.id).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {filteredEntries.length === 0 ? (
        <p className="channel__empty">
          {t('projects.empty', language, {
            category: t(CATEGORIES.find((item) => item.id === selectedCategory)?.key || 'projects.all', language)
          })}
        </p>
      ) : (
        <EntryReturnFocus type="projects">
          <div 
            className="channel__list" 
            key={selectedCategory} 
            data-category={selectedCategory}
          >
            {filteredEntries.map((entry, index) => {
              const tone = PROJECT_TONES[entry.slug] ?? 'neutral';
              return (
                <ProjectListItem
                  key={entry.slug}
                  entry={entry}
                  type="projects"
                  tone={tone}
                  category={entry.category}
                  style={{ '--channel-card-index': index }}
                />
              );
            })}
          </div>
        </EntryReturnFocus>
      )}
    </section>
  );
}
