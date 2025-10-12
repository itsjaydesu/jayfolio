'use client';

import { useState, useEffect } from 'react';

export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for admin session cookie
    const checkAdminStatus = () => {
      // Check if admin_session cookie exists
      const hasAdminCookie = document.cookie
        .split('; ')
        .some(row => row.startsWith('admin_session='));
      
      setIsAdmin(hasAdminCookie);
      setLoading(false);
    };

    checkAdminStatus();

    // Listen for storage events to sync admin status across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'adminStatusChange') {
        checkAdminStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check status when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAdminStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isAdmin, loading };
}
