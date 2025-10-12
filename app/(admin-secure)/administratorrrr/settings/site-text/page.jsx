'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminFetch } from '@/components/admin-session-context';

export default function SiteTextSettingsPage() {
  const adminFetch = useAdminFetch();
  const [brand, setBrand] = useState('');
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await adminFetch('/api/site-text', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load');
        if (ignore) return;
        setBrand(data.brand || '');
        setItems(Array.isArray(data.primaryMenu) ? data.primaryMenu : []);
      } catch (e) {
        if (!ignore) setStatus(e.message);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [adminFetch]);

  const setItem = useCallback((index, patch) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }, []);

  const moveItem = useCallback((index, dir) => {
    setItems((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      const [it] = next.splice(index, 1);
      next.splice(j, 0, it);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setStatus('');
      const res = await adminFetch('/api/site-text', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, primaryMenu: items })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      setStatus('Saved');
    } catch (e) {
      setStatus(e.message);
    } finally {
      setSaving(false);
    }
  }, [adminFetch, brand, items]);

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <div>
          <h1>Site Text</h1>
          <p>Edit brand and primary menu text. Changes apply across the site.</p>
        </div>
      </header>
      <section className="admin-editor-panel">
        <div className="admin-field">
          <label htmlFor="brand">Brand</label>
          <input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
        <div className="admin-field">
          <label>Primary Menu</label>
          <div className="field-settings__grid">
            {items.map((item, index) => (
              <div key={item.id || index} className="admin-field">
                <div className="admin-field-row">
                  <div className="admin-field">
                    <label htmlFor={`label-${index}`}>Label</label>
                    <input
                      id={`label-${index}`}
                      value={item.label || ''}
                      onChange={(e) => setItem(index, { label: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label htmlFor={`route-${index}`}>Route</label>
                    <input
                      id={`route-${index}`}
                      value={item.route || ''}
                      onChange={(e) => setItem(index, { route: e.target.value })}
                    />
                  </div>
                </div>
                <div className="admin-field">
                  <label htmlFor={`desc-${index}`}>Hover Description</label>
                  <textarea
                    id={`desc-${index}`}
                    rows={2}
                    value={item.description || ''}
                    onChange={(e) => setItem(index, { description: e.target.value })}
                  />
                </div>
                <div className="admin-actions">
                  <span className="admin-status">{item.id}</span>
                  <div className="admin-actions__buttons">
                    <button type="button" className="admin-ghost" onClick={() => moveItem(index, -1)}>
                      Move Up
                    </button>
                    <button type="button" className="admin-ghost" onClick={() => moveItem(index, 1)}>
                      Move Down
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-actions">
          {status && <span className="admin-status">{status}</span>}
          <div className="admin-actions__buttons">
            <button type="button" className="admin-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
