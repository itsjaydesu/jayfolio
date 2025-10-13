'use client';

import { useState, useMemo } from 'react';
import PostCard from '../../components/PostCard';
import { useLanguage } from '../../contexts/LanguageContext';
import { t, getCategoryName, getLocalizedContent } from '../../lib/translations';

const CONTENT_TONES = {
  'slow-scan-memo': 'violet',
  'field-lexicon': 'teal',
  'dispatch-09': 'magenta',
  'comedy-special': 'amber',
  'blog-thoughts': 'cyan'
};

// Get localized categories based on language
function getLocalizedCategories(language = 'en') {
  return [
    { key: 'all', label: t('content.all', language) },
    { key: 'essays', label: t('content.essays', language) },
    { key: 'blog', label: t('content.blog', language) },
    { key: 'comedy', label: t('content.comedy', language) }
  ];
}

export default function ContentContent({ entries, hero, isAdmin = false }) {
  const { language } = useLanguage();
  const localizedCategories = useMemo(() => getLocalizedCategories(language), [language]);
  const [selectedCategory, setSelectedCategory] = useState(localizedCategories[0].key);

  // Auto-categorize entries based on tags or content
  const categorizedEntries = useMemo(() => {
    return entries.map(entry => {
      let category = 'blog';
      
      const lowerTags = entry.tags?.map(t => t.toLowerCase()) || [];
      const titleEn = getLocalizedContent(entry.title, 'en') || '';
      const contentEn = getLocalizedContent(entry.content, 'en') || '';
      const lowerTitle = titleEn.toLowerCase();
      const lowerContent = contentEn.toLowerCase();
      
      // Check for essay
      if (lowerTags.includes('essay') || 
          contentEn.length > 1500 ||
          lowerTitle.includes('essay') ||
          lowerTitle.includes('elites')) {
        category = 'essays';
      }
      // Check for comedy
      else if (lowerTags.includes('comedy') || 
               lowerTags.includes('satire') ||
               lowerTags.includes('humor') ||
               lowerTitle.includes('comedy') ||
               lowerTitle.includes('funny') ||
               lowerContent.includes('joke')) {
        category = 'comedy';
      }
      // Everything else is Blog
      
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

  return (
    <section className="channel channel--words">
      <header className="channel__intro">
        <h1 className="channel__title">{getLocalizedContent(hero.title, language) || t('content.title', language)}</h1>
        <p className="channel__lead">{getLocalizedContent(hero.lead, language) || t('content.lead', language)}</p>
        
        <div className="channel__categories">
          {localizedCategories.map(category => {
            const isAll = category.key === 'all';
            const count = isAll ? 0 : categorizedEntries.filter(e => e.category === category.key).length;
            
            return (
              <button
                key={category.key}
                className={`channel__category-btn ${selectedCategory === category.key ? 'channel__category-btn--active' : ''}`}
                onClick={() => setSelectedCategory(category.key)}
                aria-pressed={selectedCategory === category.key}
              >
                {category.label}
                {!isAll && (
                  <span className="channel__category-count">
                    {t('content.category-count', language, { count })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {filteredEntries.length === 0 ? (
        <p className="channel__empty">
          {t('content.empty', language, { 
            category: selectedCategory === 'all' 
              ? t('content.all', language)
              : getCategoryName(selectedCategory, language)
          })}
        </p>
      ) : (
        <div className="channel__grid" key={selectedCategory} data-category={selectedCategory}>
          {filteredEntries.map((entry) => {
            const tone = CONTENT_TONES[entry.slug] ?? 'neutral';
            return (
              <PostCard
                key={entry.slug}
                entry={entry}
                type="content"
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
