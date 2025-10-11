'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';

const AdminSessionContext = createContext(null);

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function AdminSessionProvider({ csrfToken, children }) {
  const value = useMemo(() => ({ csrfToken: csrfToken || '' }), [csrfToken]);
  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error('useAdminSession must be used within an AdminSessionProvider');
  }
  return context;
}

export function useAdminFetch() {
  const { csrfToken } = useAdminSession();

  return useCallback(
    (input, init = {}) => {
      const method = (init.method || 'GET').toUpperCase();
      if (SAFE_METHODS.has(method)) {
        return fetch(input, init);
      }

      const headers = new Headers(init.headers || {});
      headers.set('X-Admin-CSRF', csrfToken);

      return fetch(input, { ...init, headers });
    },
    [csrfToken]
  );
}
