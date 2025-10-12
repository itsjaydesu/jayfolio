'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatDisplayDate } from '../../lib/formatters';

const WORD_TONES = {
  'slow-scan-memo': 'violet',
  'field-lexicon': 'teal',
  'dispatch-09': 'magenta'
};

const CATEGORIES = ['All', 'Blog', 'Essays'];

export default function WordsContent({ entries, hero }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Auto-categorize entries based on tags or content
  const categorizedEntries = useMemo(() => {
    return entries.map(entry => {
      // Check for essay tag or longer content
      const isEssay = entry.tags?.includes('essay') || 
                     entry.content?.length > 1500 ||
                     entry.title?.toLowerCase().includes('essay');
      
      return {
        ...entry,
        category: isEssay ? 'Essays' : 'Blog'
      };
    });
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (selectedCategory === 'All') return categorizedEntries;
    return categorizedEntries.filter(entry => entry.category === selectedCategory);
  }, [categorizedEntries, selectedCategory]);

  return (
    <section className="channel channel--words">
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
        <p className="channel__empty">No {selectedCategory.toLowerCase()} entries found.</p>
      ) : (
        <div className="channel__grid">
          {filteredEntries.map((entry) => {
            const tone = WORD_TONES[entry.slug] ?? 'neutral';
            return (
              <article
                key={entry.slug}
                className="project-entry project-entry--words"
                data-tone={tone}
                data-entry-slug={entry.slug}
              >
                <Link
                  href={`/words/${entry.slug}`}
                  className="project-entry__surface"
                  aria-label={`Open ${entry.category === 'Essays' ? 'essay' : 'blog post'} ${entry.title}`}
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

                    <span className="project-entry__cta">
                      Open {entry.category === 'Essays' ? 'essay' : 'post'} ↗
                    </span>
                  </div>

                  <figure className="project-entry__figure project-entry__figure--words" aria-hidden="true">
                    <div className="project-entry__art" />
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
