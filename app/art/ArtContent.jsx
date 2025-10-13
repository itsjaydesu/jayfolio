'use client';

import PostCard from '../../components/PostCard';
import EntryReturnFocus from '../../components/EntryReturnFocus';

const ART_TONES = {
  'dot-field': 'violet'
};

export default function ArtContent({ entries, hero, isAdmin = false }) {
  return (
    <section className="channel channel--art">
      <header className="channel__intro">
        <h1 className="channel__title">{hero.title}</h1>
        <p className="channel__lead">{hero.lead}</p>
      </header>

      {entries.length === 0 ? (
        <p className="channel__empty">No art entries yet. Upload one via the admin console.</p>
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
