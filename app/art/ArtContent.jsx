'use client';

import PostCard from '../../components/PostCard';
import EntryReturnFocus from '../../components/EntryReturnFocus';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedContent, t } from '../../lib/translations';

const ART_TONES = {
  'dot-field': 'violet'
};

export default function ArtContent({ entries, hero, isAdmin = false }) {
  const { language } = useLanguage();
  return (
    <section className="channel channel--art">
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
