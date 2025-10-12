import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AdminNav from '@/components/admin-nav';
import AdminLogoutButton from '@/components/AdminLogoutButton';
import { AdminSessionProvider } from '@/components/admin-session-context';
import { readSiteText } from '../../../lib/siteText';
import { SITE_TEXT_DEFAULTS } from '../../../lib/siteTextDefaults';
import { ADMIN_SESSION_COOKIE, createCsrfToken, verifyAdminSession } from '../../../lib/adminAuth';

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    redirect('/administratorrrr/login');
  }

  const session = await verifyAdminSession(sessionCookie);

  if (!session) {
    redirect('/administratorrrr/login');
  }

  const csrfToken = (await createCsrfToken(session.sessionId)) ?? '';
  const siteText = await readSiteText().catch(() => SITE_TEXT_DEFAULTS);
  const brand = siteText?.brand ?? SITE_TEXT_DEFAULTS.brand;
  const primaryMenu = Array.isArray(siteText?.primaryMenu) && siteText.primaryMenu.length
    ? siteText.primaryMenu
    : SITE_TEXT_DEFAULTS.primaryMenu;

  return (
    <AdminSessionProvider csrfToken={csrfToken}>
      <div className="admin-frame">
        <header className="admin-frame__topbar">
          <div className="admin-frame__identity">
            <Link href="/" className="admin-frame__brand-link">
              {brand}
            </Link>
            <span className="admin-frame__badge">Admin</span>
          </div>
          <nav className="admin-frame__primary" aria-label="Primary site navigation">
            {primaryMenu.map((item) => (
              <Link key={item.id ?? item.route} href={item.route} className="admin-frame__primary-link">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="admin-frame__actions">
            <Link href="/" className="admin-frame__view-site">
              View site
            </Link>
            <AdminLogoutButton className="admin-frame__logout" />
          </div>
        </header>
        <div className="admin-frame__subnav">
          <AdminNav />
        </div>
        <main className="admin-frame__content">{children}</main>
      </div>
    </AdminSessionProvider>
  );
}
