export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_CSRF_HEADER = 'x-admin-csrf';

function getAdminSecret() {
  const value = process.env.ADMIN_SECRET;
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function timingSafeEqual(a, b) {
  if (!a || !b) return false;
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  let mismatch = a.length === b.length ? 0 : 1;
  const maxLength = Math.max(a.length, b.length);
  for (let i = 0; i < maxLength; i += 1) {
    const charA = a.charCodeAt(i) || 0;
    const charB = b.charCodeAt(i) || 0;
    mismatch |= charA ^ charB;
  }

  return mismatch === 0;
}

const textEncoder = new TextEncoder();

function getCrypto() {
  const { crypto } = globalThis;
  if (!crypto || typeof crypto.subtle === 'undefined') {
    throw new Error('Web Crypto API is not available in this runtime');
  }
  return crypto;
}

function bufferToHex(buffer) {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function sign(value, secret) {
  const cryptoRef = getCrypto();
  const key = await cryptoRef.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await cryptoRef.subtle.sign('HMAC', key, textEncoder.encode(value));
  return bufferToHex(signature);
}

async function randomHex(bytes = 32) {
  const cryptoRef = getCrypto();
  const array = new Uint8Array(bytes);
  cryptoRef.getRandomValues(array);
  return bufferToHex(array);
}

export async function createAdminSessionToken() {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error('ADMIN_SECRET is not configured');
  }
  const sessionId = await randomHex(32);
  const signature = await sign(sessionId, secret);
  return { token: `${sessionId}.${signature}`, sessionId };
}

export async function verifyAdminSession(token) {
  const secret = getAdminSecret();
  if (!secret || typeof token !== 'string') {
    return null;
  }
  const [sessionId, signature] = token.split('.');
  if (!sessionId || !signature) {
    return null;
  }
  const expected = await sign(sessionId, secret);
  return timingSafeEqual(signature, expected) ? { sessionId } : null;
}

export async function createCsrfToken(sessionId) {
  const secret = getAdminSecret();
  if (!secret || !sessionId) {
    return null;
  }
  return sign(`${sessionId}:csrf`, secret);
}

export async function verifyCsrfToken(sessionId, token) {
  const secret = getAdminSecret();
  if (!secret || !sessionId || !token) {
    return false;
  }
  const expected = await sign(`${sessionId}:csrf`, secret);
  return timingSafeEqual(token, expected);
}

export function isAdminSecretConfigured() {
  return Boolean(getAdminSecret());
}
