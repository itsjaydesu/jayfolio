'use client';

import { useEffect, useRef } from 'react';
import { ENTRY_RETURN_STORAGE_KEY } from '../lib/entryReturn';

function focusElementSilently(element) {
  if (!element) return;
  element.setAttribute('tabindex', '-1');
  element.focus({ preventScroll: true });
  element.removeAttribute('tabindex');
}

export default function EntryReturnFocus({ type, children }) {
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    if (typeof window === 'undefined') return;

    let payload;
    try {
      const raw = window.sessionStorage.getItem(ENTRY_RETURN_STORAGE_KEY);
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.groupCollapsed('[EntryReturnFocus] mount');
      console.log('type prop:', type);
      console.log('raw payload:', payload);
      console.log('location:', window.location.pathname);
      console.groupEnd();
    }

    if (!payload || payload.type !== type || !payload.slug) return;

    // Discard stale payloads (> 5 minutes old)
    const MAX_AGE_MS = 5 * 60 * 1000;
    if (payload.timestamp && Date.now() - payload.timestamp > MAX_AGE_MS) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[EntryReturnFocus] ignoring stale payload', payload);
      }
      window.sessionStorage.removeItem(ENTRY_RETURN_STORAGE_KEY);
      return;
    }

    hasRunRef.current = true;

    const MIN_HEIGHT = 48; // px; avoid measuring skeletons/zero-height nodes
    const MAX_ATTEMPTS = 20; // ~1s with 50ms interval
    let attempts = 0;

    const tryScroll = () => {
      attempts += 1;
      const target = document.querySelector(`[data-entry-slug="${payload.slug}"]`);
      if (!target) {
        if (process.env.NODE_ENV === 'development' && attempts === 1) {
          const nodes = Array.from(document.querySelectorAll('[data-entry-slug]'));
          const slugsInDom = nodes.map(n => n.getAttribute('data-entry-slug'));
          const grid = document.querySelector('.channel__grid');
          console.warn('[EntryReturnFocus] target not found', {
            expectedSlug: payload.slug,
            slugsInDom,
            gridCategory: grid?.getAttribute('data-category') || null,
            gridExists: !!grid
          });
        }
        if (attempts < MAX_ATTEMPTS) {
          return window.setTimeout(tryScroll, 50);
        }
        window.sessionStorage.removeItem(ENTRY_RETURN_STORAGE_KEY);
        return;
      }

      const rect = target.getBoundingClientRect();
      const height = rect.height || target.offsetHeight || 0;
      if (height < MIN_HEIGHT) {
        if (attempts < MAX_ATTEMPTS) {
          return window.setTimeout(tryScroll, 50);
        }
        window.sessionStorage.removeItem(ENTRY_RETURN_STORAGE_KEY);
        return;
      }

      const destination = window.scrollY + rect.top - Math.max((window.innerHeight - height) / 2, 0);
      const dest = Math.max(destination, 0);
      if (process.env.NODE_ENV === 'development') {
        console.log('[EntryReturnFocus] scrolling to entry', {
          slug: payload.slug,
          attempts,
          rectTop: rect.top,
          height,
          currentScrollY: window.scrollY,
          destination: dest
        });
      }

      window.setTimeout(() => {
        const beforeY = window.scrollY;
        window.scrollTo({ top: dest, behavior: 'smooth' });
        target.classList.add('is-return-focus');
        focusElementSilently(target);

        // Verify and fallback if nothing moved
        window.setTimeout(() => {
          const afterY = window.scrollY;
          const tr = target.getBoundingClientRect();
          const stillAtTop = Math.abs(afterY - beforeY) < 2;
          const farFromCenter = Math.abs(tr.top - (window.innerHeight - tr.height) / 2) > 8;
          if (stillAtTop && farFromCenter) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[EntryReturnFocus] window.scrollTo ineffective; using scrollIntoView fallback', {
                beforeY,
                afterY,
                trTop: tr.top,
                trHeight: tr.height
              });
            }
            try {
              target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            } catch {
              // ignore
            }
          }
        }, 260);

        window.setTimeout(() => {
          target.classList.remove('is-return-focus');
        }, 700);
      }, 120);

      window.sessionStorage.removeItem(ENTRY_RETURN_STORAGE_KEY);
    };

    tryScroll();
  }, [type]);

  return children;
}
