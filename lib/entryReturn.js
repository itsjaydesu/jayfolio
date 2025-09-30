'use client';

export const ENTRY_RETURN_STORAGE_KEY = 'entry:return-anchor';

export function storeEntryReturnTarget(type, slug) {
  if (typeof window === 'undefined' || !type || !slug) return;
  try {
    window.sessionStorage.setItem(
      ENTRY_RETURN_STORAGE_KEY,
      JSON.stringify({ type, slug, timestamp: Date.now() })
    );
  } catch {
    // Ignore storage errors (e.g., private mode restrictions)
  }
}
