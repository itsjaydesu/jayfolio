'use client';

import { useState, useMemo } from 'react';
import PostCard from '../../components/PostCard';

const WORD_TONES = {
  'slow-scan-memo': 'violet',
  'field-lexicon': 'teal',
  'dispatch-09': 'magenta'
};

const CATEGORIES = ['All', 'Blog', 'Essays'];

export default function WordsContent({ entries, hero, isAdmin = false }) {
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
        <div className="channel__grid" key={selectedCategory} data-category={selectedCategory}>
          {filteredEntries.map((entry) => {
            const tone = WORD_TONES[entry.slug] ?? 'neutral';
            return (
              <PostCard
                key={entry.slug}
                entry={entry}
                type="words"
                tone={tone}
                isAdmin={isAdmin}
                category={entry.category}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
