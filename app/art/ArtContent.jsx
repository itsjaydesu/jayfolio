'use client';

import { useState, useEffect } from 'react';
import PostCard from '../../components/PostCard';
import EntryReturnFocus from '../../components/EntryReturnFocus';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedContent, t } from '../../lib/translations';

const ART_TONES = {
  'dot-field': 'violet'
};

export default function ArtContent({ entries, hero }) {
  const { language } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  
  const backgroundImage = hero.backgroundImage || '';
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  return (
    <section className={`channel channel--art ${isLoaded ? 'is-loaded' : ''} ${backgroundImage ? 'has-background-image' : ''}`}>
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
        <h1 className="channel__title">{getLocalizedContent(hero.title, language) || t('nav.art', language)}</h1>
        <p className="channel__lead">{getLocalizedContent(hero.lead, language)}</p>
      </header>

      {entries.length === 0 ? (
        <p className="channel__empty">{t('art.empty', language)}</p>
      ) : (
        <EntryReturnFocus type="art">
          <div className="channel__grid">
            {entries.map((entry, index) => {
              const tone = ART_TONES[entry.slug] ?? 'neutral';
              return (
                <PostCard
                  key={entry.slug}
                  entry={entry}
                  type="art"
                  tone={tone}
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
