import { NextResponse } from 'next/server';
import {
  ADMIN_CSRF_HEADER,
  ADMIN_SESSION_COOKIE,
  isAdminSecretConfigured,
  verifyAdminSession,
  verifyCsrfToken
} from './lib/adminAuth';

const PROTECTED_API_PREFIXES = [
  '/api/content',
  '/api/media',
  '/api/field-settings',
  '/api/channel-content',
  '/api/site-text',
  '/api/seo',
  '/api/upload'
];

const SAFE_API_READ_PREFIXES = ['/api/site-text', '/api/field-settings'];
const ALLOWED_COUNTRIES = new Set(['JP']);

const isProductionDeployment = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === 'production'
  : process.env.NODE_ENV === 'production';

function resolveRequestCountry(request) {
  const geoCountry = request.geo?.country;
  if (geoCountry && typeof geoCountry === 'string') {
    return geoCountry.toUpperCase();
  }

  const headerCountry = request.headers.get('x-vercel-ip-country');
  if (headerCountry && typeof headerCountry === 'string') {
    return headerCountry.toUpperCase();
  }

  return null;
}

function shouldProtect(pathname, method) {
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/admin/session')) {
      return false;
    }
    const matchesProtectedPrefix = PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!matchesProtectedPrefix) {
      return false;
    }
    if (!isWriteMethod(method)) {
      return !SAFE_API_READ_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    }
    return true;
  }

  if (pathname === '/administratorrrr/login' || pathname.startsWith('/administratorrrr/login/')) {
    return false;
  }

  return pathname === '/administratorrrr' || pathname.startsWith('/administratorrrr/');
}

function isWriteMethod(method) {
  const upper = method.toUpperCase();
  return upper !== 'GET' && upper !== 'HEAD' && upper !== 'OPTIONS';
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (!shouldProtect(pathname, request.method)) {
    return NextResponse.next();
  }

  if (isProductionDeployment) {
    const country = resolveRequestCountry(request);
    if (!country || !ALLOWED_COUNTRIES.has(country)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  if (!isAdminSecretConfigured()) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Admin secret not configured' }, { status: 503 });
    }
    return new NextResponse('Admin secret not configured', { status: 503 });
  }

  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = sessionCookie ? await verifyAdminSession(sessionCookie) : null;

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/administratorrrr/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/api/') && isWriteMethod(request.method)) {
    const csrfToken = request.headers.get(ADMIN_CSRF_HEADER);
    if (!(await verifyCsrfToken(session.sessionId, csrfToken))) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/administratorrrr/:path*', '/api/:path*']
};
