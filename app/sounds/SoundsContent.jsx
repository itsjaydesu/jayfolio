'use client';

import PostCard from '../../components/PostCard';
import EntryReturnFocus from '../../components/EntryReturnFocus';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedContent, t } from '../../lib/translations';

const SOUND_TONES = {
  reviola: 'violet'
};

export default function SoundsContent({ entries, hero, isAdmin = false }) {
  const { language } = useLanguage();
  return (
    <section className="channel channel--sounds">
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
