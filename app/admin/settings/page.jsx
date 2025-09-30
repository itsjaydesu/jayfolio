import Link from 'next/link';
import AdminNav from '../../../components/admin-nav';

const SETTINGS_LINKS = [
  {
    href: '/admin/settings/site-text',
    title: 'Site Text',
    description: 'Manage brand copy and primary navigation labels.'
  },
  {
    href: '/admin/settings/field',
    title: 'Field Settings',
    description: 'Control the dotfield baseline mood and channel overrides.'
  }
];

export default function AdminSettingsIndexPage() {
  return (
    <div className="admin-shell">
      <AdminNav />
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
