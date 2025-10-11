import { Suspense } from 'react';
import AdminLoginForm from './AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="admin-login">
          <div className="admin-login__card">
            <p>Loading…</p>
          </div>
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
