'use client';

import { useState, useEffect } from 'react';
import PostCard from '../../components/PostCard';
import EntryReturnFocus from '../../components/EntryReturnFocus';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedContent, t } from '../../lib/translations';

const ART_TONES = {
  'dot-field': 'violet'
};

export default function ArtContent({ entries, hero, isAdmin = false }) {
  const { language } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const backgroundImage = hero.backgroundImage || '';

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Scroll detection for fade effect
  useEffect(() => {
    let rafId = null;
    const scrollThreshold = 80;

    const handleScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const isScrolled = scrollY > scrollThreshold;

        if (isScrolled !== scrolled) {
          setScrolled(isScrolled);
        }

        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [scrolled]);

  return (
    <section
      className={`channel channel--art ${isLoaded ? 'is-loaded' : ''} ${backgroundImage ? 'has-background-image' : ''}`}
      data-scrolled={scrolled ? "true" : "false"}
    >
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
            {entries.map((entry) => {
              const tone = ART_TONES[entry.slug] ?? 'neutral';
              return (
                <PostCard
                  key={entry.slug}
                  entry={entry}
                  type="art"
                  tone={tone}
                  isAdmin={isAdmin}
                />
              );
            })}
          </div>
        </EntryReturnFocus>
      )}
    </section>
  );
}
