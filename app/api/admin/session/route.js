import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, isAdminSecretConfigured } from '../../../../lib/adminAuth';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 8
};

function getAdminSecret() {
  const secret = process.env.ADMIN_SECRET;
  if (typeof secret !== 'string' || !secret.trim()) {
    return null;
  }
  return secret.trim();
}

export async function POST(request) {
  if (!isAdminSecretConfigured()) {
    return NextResponse.json({ error: 'Admin secret not configured' }, { status: 503 });
  }

  try {
    const { secret } = await request.json();
    const expected = getAdminSecret();
    if (!secret || !expected || secret !== expected) {
      return NextResponse.json({ error: 'Invalid passphrase' }, { status: 401 });
    }

    const { token } = createAdminSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
