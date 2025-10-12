import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from './adminAuth';

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
