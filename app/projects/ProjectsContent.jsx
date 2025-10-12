'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDisplayDate } from '../../lib/formatters';

const PROJECT_TONES = {
  'signal-grid': 'cyan',
  'resonant-atlas': 'amber',
  'signal-bloom': 'magenta'
};

const CATEGORIES = ['All', 'Useful Tools', 'Fun', 'Events', 'Startups'];

export default function ProjectsContent({ entries, hero }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  return (
    <section className="channel channel--projects">
      <header className="channel__intro">
        <h1 className="channel__title">{hero.title}</h1>
        <p className="channel__lead">{hero.lead}</p>
        
        <div className="channel__categories">
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={`channel__category-btn ${selectedCategory === category ? 'channel__category-btn--active' : ''}`}
              onClick={() => setSelectedCategory(category)}
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
        <div className="channel__grid">
          {filteredEntries.map((entry) => {
            const tone = PROJECT_TONES[entry.slug] ?? 'neutral';
            const href = `/projects/${entry.slug}`;
            return (
              <article
                key={entry.slug}
                className="project-entry"
                data-tone={tone}
                data-entry-slug={entry.slug}
              >
                <Link
                  href={href}
                  className="project-entry__surface"
                  aria-label={`Open dossier for ${entry.title}`}
                >
                  <div className="project-entry__content">
                    {entry.createdAt ? (
                      <time className="project-entry__date" dateTime={entry.createdAt}>
                        {formatDisplayDate(entry.createdAt).toUpperCase()}
                      </time>
                    ) : null}

                    <div className="project-entry__body">
                      <p className="project-entry__category">{entry.category}</p>
                      {entry.tags?.length ? (
                        <p className="project-entry__tags">{entry.tags.join(' • ')}</p>
                      ) : null}
                      <h2 className="project-entry__title">{entry.title}</h2>
                      {entry.summary ? <p className="project-entry__summary">{entry.summary}</p> : null}
                    </div>

                    <span className="project-entry__cta">Open dossier ↗</span>
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
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
