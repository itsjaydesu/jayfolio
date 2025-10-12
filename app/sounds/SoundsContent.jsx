'use client';

import PostCard from '../../components/PostCard';
import EntryReturnFocus from '../../components/EntryReturnFocus';

const SOUND_TONES = {
  reviola: 'violet'
};

export default function SoundsContent({ entries, hero, isAdmin = false }) {
  return (
    <section className="channel channel--sounds">
      <header className="channel__intro">
        <h1 className="channel__title">{hero.title}</h1>
        <p className="channel__lead">{hero.lead}</p>
      </header>

      {entries.length === 0 ? (
        <p className="channel__empty">No sound entries yet. Upload one via the admin console.</p>
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
