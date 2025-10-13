'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import PostCard from '../../components/PostCard';
import { useLanguage } from '../../contexts/LanguageContext';
import { t, getLocalizedContent } from '../../lib/translations';

const PROJECT_TONES = {
  'signal-grid': 'cyan',
  'resonant-atlas': 'amber',
  'signal-bloom': 'magenta'
};

export default function ProjectsContent({ entries, hero, isAdmin = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef(null);
  const { language } = useLanguage();
  
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
  
  // Restore scroll position when coming back
  useEffect(() => {
    const scrollPos = sessionStorage.getItem('projectsScrollPosition');
    if (scrollPos && containerRef.current) {
      window.scrollTo(0, parseInt(scrollPos, 10));
      sessionStorage.removeItem('projectsScrollPosition');
    }
    const storedCategory = sessionStorage.getItem('projectsSelectedCategory');
    if (storedCategory && storedCategory !== selectedCategory) {
      const normalized = storedCategory.toLowerCase();
      if (CATEGORIES.some((item) => item.id === normalized)) {
        setSelectedCategory(normalized);
      }
    }
    sessionStorage.removeItem('projectsSelectedCategory');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
  
  // Save scroll position before navigating away
  const handleProjectClick = () => {
    sessionStorage.setItem('projectsScrollPosition', window.scrollY.toString());
    sessionStorage.setItem('projectsSelectedCategory', selectedCategory);
  };

  // Auto-categorize entries based on tags, title, or content
  const categorizedEntries = useMemo(() => {
    return entries.map(entry => {
      let category = 'useful-tools'; // Default

      const titleEn = getLocalizedContent(entry.title, 'en') || '';
      const contentEn = getLocalizedContent(entry.content, 'en') || '';
      const lowerTitle = titleEn.toLowerCase();
      const lowerTags = entry.tags?.map(t => t.toLowerCase()) || [];
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
    <section className="channel channel--projects" ref={containerRef}>
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
        <div className="channel__grid" key={selectedCategory} data-category={selectedCategory}>
          {filteredEntries.map((entry) => {
            const tone = PROJECT_TONES[entry.slug] ?? 'neutral';
            return (
              <PostCard
                key={entry.slug}
                entry={entry}
                type="projects"
                tone={tone}
                isAdmin={isAdmin}
                category={entry.category}
                onClick={handleProjectClick}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
