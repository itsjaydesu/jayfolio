import Link from 'next/link';
import AdminNav from '@/components/admin-nav';

const CHANNEL_LINKS = [
  {
    href: '/administratorrrr/settings/channel/about',
    title: 'About Channel Copy',
    description: 'Edit the about capsule hero, history, and studio signals.'
  },
  {
    href: '/administratorrrr/settings/channel/projects',
    title: 'Projects Hero Copy',
    description: 'Update the projects hero title and lead text.'
  },
  {
    href: '/administratorrrr/settings/channel/words',
    title: 'Words Hero Copy',
    description: 'Tune the words hero headline and descriptive lead.'
  },
  {
    href: '/administratorrrr/settings/channel/sounds',
    title: 'Sounds Hero Copy',
    description: 'Adjust the sounds hero headline and supporting copy.'
  },
  {
    href: '/administratorrrr/settings/channel/art',
    title: 'Art Hero Copy',
    description: 'Curate the art hero headline with language tuned for generative studies.'
  }
];

export default function ChannelSettingsIndexPage() {
  return (
    <div className="admin-shell">
      <AdminNav />
      <header className="admin-shell__header">
        <div>
          <h1>Channel Copy</h1>
          <p>Select a channel to edit its contextual hero content.</p>
        </div>
      </header>
      <section className="admin-card-grid">
        {CHANNEL_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="admin-card">
            <span className="admin-card__title">{item.title}</span>
            <span className="admin-card__description">{item.description}</span>
            <span className="admin-card__cta" aria-hidden>
              Open
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
