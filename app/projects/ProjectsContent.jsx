'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatDisplayDate } from '../../lib/formatters';

const PROJECT_TONES = {
  'signal-grid': 'cyan',
  'resonant-atlas': 'amber',
  'signal-bloom': 'magenta'
};

const CATEGORIES = ['All', 'Useful Tools', 'Fun', 'Events', 'Startups'];

export default function ProjectsContent({ entries, hero, isAdmin = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef(null);
  
  // Get initial category from URL or default to 'All'
  const initialCategory = searchParams.get('category') || 'All';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  
  // Restore scroll position when coming back
  useEffect(() => {
    const scrollPos = sessionStorage.getItem('projectsScrollPosition');
    if (scrollPos && containerRef.current) {
      window.scrollTo(0, parseInt(scrollPos, 10));
      sessionStorage.removeItem('projectsScrollPosition');
    }
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
    if (category === 'All') {
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
      let category = 'Useful Tools'; // Default
      
      const lowerTitle = entry.title?.toLowerCase() || '';
      const lowerTags = entry.tags?.map(t => t.toLowerCase()) || [];
      const lowerContent = entry.content?.toLowerCase() || '';
      
      // Check for Startups
      if (lowerTags.includes('saas') || 
          lowerTags.includes('startup') ||
          lowerTitle.includes('makeleaps') ||
          lowerContent.includes('bootstrapped') ||
          lowerContent.includes('company') ||
          lowerContent.includes('platform')) {
        category = 'Startups';
      }
      // Check for Fun projects
      else if (lowerTags.includes('game') || 
               lowerTags.includes('satire') ||
               lowerTitle.includes('durwhirl') ||
               lowerTitle.includes('battle') ||
               lowerTitle.includes('simulator') ||
               lowerContent.includes('game') ||
               lowerContent.includes('play')) {
        category = 'Fun';
      }
      // Check for Events
      else if (lowerTags.includes('event') || 
               lowerTags.includes('conference') ||
               lowerContent.includes('event') ||
               lowerContent.includes('conference')) {
        category = 'Events';
      }
      // Check for Useful Tools
      else if (lowerTags.includes('tool') || 
               lowerTags.includes('tooling') ||
               lowerTags.includes('utility') ||
               lowerTitle.includes('generator') ||
               lowerTitle.includes('builder') ||
               lowerContent.includes('tool')) {
        category = 'Useful Tools';
      }
      
      return {
        ...entry,
        category
      };
    });
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (selectedCategory === 'All') return categorizedEntries;
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
        <h1 className="channel__title">{hero.title}</h1>
        <p className="channel__lead">{hero.lead}</p>
        
        <div className="channel__categories">
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={`channel__category-btn ${selectedCategory === category ? 'channel__category-btn--active' : ''}`}
              onClick={() => handleCategoryChange(category)}
              aria-pressed={selectedCategory === category}
            >
              {category}
              {category !== 'All' && (
                <span className="channel__category-count">
                  {categorizedEntries.filter(e => e.category === category).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {filteredEntries.length === 0 ? (
        <p className="channel__empty">No {selectedCategory.toLowerCase()} projects found.</p>
      ) : (
        <div className="channel__grid" key={selectedCategory} data-category={selectedCategory}>
          {filteredEntries.map((entry) => {
            const tone = PROJECT_TONES[entry.slug] ?? 'neutral';
            const href = `/projects/${entry.slug}`;
            const editHref = `/administratorrrr?type=projects&slug=${encodeURIComponent(entry.slug)}`;
            return (
              <article
                key={entry.slug}
                className="project-entry"
                data-tone={tone}
                data-entry-slug={entry.slug}
              >
                <div className="project-entry__surface">
                  <div className="project-entry__content">
                    <div className="project-entry__header">
                      {entry.createdAt ? (
                        <time className="project-entry__date" dateTime={entry.createdAt}>
                          {formatDisplayDate(entry.createdAt).toUpperCase()}
                        </time>
                      ) : null}
                      <span className="project-entry__category">{entry.category}</span>
                    </div>

                    <div className="project-entry__body">
                      {entry.tags?.length ? (
                        <p className="project-entry__tags">{entry.tags.join(' • ')}</p>
                      ) : null}
                      <div className="project-entry__title-row">
                        <h2 className="project-entry__title">{entry.title}</h2>
                        {isAdmin ? (
                          <Link
                            href={editHref}
                            className="project-entry__edit-btn"
                            aria-label={`Edit ${entry.title}`}
                          >
                            Edit
                          </Link>
                        ) : null}
                      </div>
                      {entry.summary ? <p className="project-entry__summary">{entry.summary}</p> : null}
                    </div>
                  </div>

                  <figure className="project-entry__figure">
                    {entry.coverImage?.url ? (
                      <Image
                        src={entry.coverImage.url}
                        alt={entry.coverImage.alt || `${entry.title} cover image`}
                        fill
                        sizes="(max-width: 900px) 100vw, 420px"
                        className="project-entry__image"
                      />
                    ) : (
                      <div className="project-entry__art" aria-hidden="true" />
                    )}
                  </figure>

                  <Link
                    href={href}
                    className="project-entry__overlay"
                    aria-label={`Open dossier for ${entry.title}`}
                    onClick={handleProjectClick}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
