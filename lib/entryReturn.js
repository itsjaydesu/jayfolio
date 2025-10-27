'use client';

export const ENTRY_RETURN_STORAGE_KEY = 'entry:return-anchor';

export function storeEntryReturnTarget(type, slug) {
  if (typeof window === 'undefined' || !type || !slug) return;
  try {
    const payload = { type, slug, timestamp: Date.now() };
    if (process.env.NODE_ENV === 'development') {
      // Lightweight diagnostic to help validate return behavior across routes
      console.log('[entryReturn] storeEntryReturnTarget', {
        type,
        slug,
        path: window.location.pathname,
        time: new Date().toISOString()
      });
    }
    window.sessionStorage.setItem(
      ENTRY_RETURN_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // Ignore storage errors (e.g., private mode restrictions)
  }
}
