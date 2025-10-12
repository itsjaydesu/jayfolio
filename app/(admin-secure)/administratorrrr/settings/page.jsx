import Link from 'next/link';

const SETTINGS_LINKS = [
  {
    href: '/administratorrrr/settings/site-text',
    title: 'Site Text',
    description: 'Manage brand copy and primary navigation labels.'
  },
  {
    href: '/administratorrrr/settings/seo',
    title: 'SEO Settings',
    description: 'Manage search engine optimization, social sharing, and metadata for all pages.'
  },
  {
    href: '/administratorrrr/settings/field',
    title: 'Field Settings',
    description: 'Control the dotfield baseline mood and channel overrides.'
  },
  {
    href: '/administratorrrr/settings/channel',
    title: 'Channel Copy',
    description: 'Edit per-channel hero context and about capsule copy.'
  }
];

export default function AdminSettingsIndexPage() {
  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <div>
          <h1>Settings</h1>
          <p>Configure the shared surfaces that power the site experience.</p>
        </div>
      </header>
      <section className="admin-card-grid">
        {SETTINGS_LINKS.map((item) => (
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
