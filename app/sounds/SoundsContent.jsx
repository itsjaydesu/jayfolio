'use client';

import { useState, useEffect } from 'react';
import PostCard from '../../components/PostCard';
import EntryReturnFocus from '../../components/EntryReturnFocus';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedContent, t } from '../../lib/translations';

const SOUND_TONES = {
  reviola: 'violet'
};

export default function SoundsContent({ entries, hero, isAdmin = false }) {
  const { language } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const backgroundImage = hero.backgroundImage || '';

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Scroll detection for fade effect with progressive opacity
  useEffect(() => {
    let rafId = null;
    const scrollStart = 20;
    const scrollRange = 200;

    const handleScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const progress = Math.min(Math.max((scrollY - scrollStart) / scrollRange, 0), 1);

        const section = document.querySelector('.channel--sounds');
        if (section) {
          section.style.setProperty('--scroll-progress', progress.toString());
          const isScrolled = progress > 0.05;
          if (isScrolled !== scrolled) {
            setScrolled(isScrolled);
          }
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
      className={`channel channel--sounds ${isLoaded ? 'is-loaded' : ''} ${backgroundImage ? 'has-background-image' : ''}`}
      data-scrolled={scrolled ? "true" : "false"}
    >
      {/* Scroll fade overlay - always present */}
      <div className="channel__scroll-overlay" aria-hidden="true" />

      {/* Optional background image */}
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
        <h1 className="channel__title">{getLocalizedContent(hero.title, language) || t('nav.sounds', language)}</h1>
        <p className="channel__lead">{getLocalizedContent(hero.lead, language)}</p>
      </header>

      {entries.length === 0 ? (
        <p className="channel__empty">{t('sounds.empty', language)}</p>
      ) : (
        <EntryReturnFocus type="sounds">
          <div className="channel__grid">
            {entries.map((entry) => {
              const tone = SOUND_TONES[entry.slug] ?? 'neutral';
              return (
                <PostCard
                  key={entry.slug}
                  entry={entry}
                  type="sounds"
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
