'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setStatus('');
  }, [secret]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!secret.trim()) {
        setStatus('Enter the passphrase to continue');
        return;
      }

      try {
        setIsSubmitting(true);
        setStatus('');

        const response = await fetch('/api/admin/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret })
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || 'Invalid passphrase');
        }

        // Trigger storage event to notify other tabs/windows of admin login
        localStorage.setItem('adminStatusChange', Date.now().toString());
        
        const next = searchParams?.get('next') || '/administratorrrr';
        router.replace(next);
      } catch (error) {
        setStatus(error.message || 'Login failed');
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, searchParams, secret]
  );

  return (
    <main className="admin-login">
      <form className="admin-login__card" onSubmit={handleSubmit}>
        <header className="admin-login__header">
          <h1>Admin Access</h1>
          <p>Enter the passphrase to manage site content.</p>
        </header>
        <div className="admin-field">
          <label htmlFor="admin-secret">Passphrase</label>
          <input
            id="admin-secret"
            type="password"
            autoComplete="current-password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="••••••••"
            disabled={isSubmitting}
          />
        </div>
        {status ? (
          <p className="admin-status admin-status--error" role="alert">
            {status}
          </p>
        ) : null}
        <button type="submit" className="admin-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
