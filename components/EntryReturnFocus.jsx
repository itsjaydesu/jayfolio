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

    if (!payload || payload.type !== type || !payload.slug) return;

    hasRunRef.current = true;
    window.sessionStorage.removeItem(ENTRY_RETURN_STORAGE_KEY);

    const target = document.querySelector(`[data-entry-slug="${payload.slug}"]`);
    if (!target) return;

    window.requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect();
      const destination =
        window.scrollY + rect.top - Math.max((window.innerHeight - rect.height) / 2, 0);
      window.scrollTo({ top: Math.max(destination, 0), behavior: 'smooth' });
      target.classList.add('is-return-focus');
      focusElementSilently(target);
      window.setTimeout(() => {
        target.classList.remove('is-return-focus');
      }, 1600);
    });
  }, [type]);

  return children;
}
