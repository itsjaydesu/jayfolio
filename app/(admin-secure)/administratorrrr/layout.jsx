import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminSessionProvider } from '../../../components/admin-session-context';
import { ADMIN_SESSION_COOKIE, createCsrfToken, verifyAdminSession } from '../../../lib/adminAuth';

export default async function AdminLayout({ children }) {
  const sessionCookie = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const session = sessionCookie ? await verifyAdminSession(sessionCookie) : null;

  if (!session) {
    redirect('/administratorrrr/login');
  }

  const csrfToken = await createCsrfToken(session.sessionId);

  return <AdminSessionProvider csrfToken={csrfToken}>{children}</AdminSessionProvider>;
}
