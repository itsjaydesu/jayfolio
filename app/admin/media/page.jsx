'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminNav from '../../../components/admin-nav';

function FileCard({ file, onDelete, onSaveMeta }) {
  const [title, setTitle] = useState(file.title || '');
  const [alt, setAlt] = useState(file.alt || '');
  const [tags, setTags] = useState((file.tags || []).join(', '));
  const isImage = file.type?.startsWith('image/');
  const isVideo = file.type?.startsWith('video/');
  const isAudio = file.type?.startsWith('audio/');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.url);
      // naive toast
      alert('Copied URL');
    } catch (e) {
      console.warn('clipboard failed', e);
    }
  };

  const handleSave = () => {
    const cleanTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSaveMeta(file.pathname, { title, alt, tags: cleanTags });
  };

  return (
    <div className="entry-ledger__item">
      <div className="entry-ledger__icon">
        <span className="icon" aria-hidden>
          {isImage ? '🖼️' : isVideo ? '🎞️' : isAudio ? '🎵' : '📄'}
        </span>
      </div>
      <div className="entry-ledger__body">
        <div className="entry-ledger__meta">
          <span className="entry-ledger__meta-item">{file.type || 'unknown'}</span>
          <span className="entry-ledger__meta-item">{(file.size / 1024).toFixed(0)} KB</span>
          <a href={file.url} target="_blank" rel="noreferrer" className="entry-ledger__meta-item">
            Open
          </a>
        </div>
        {isImage ? (
          <img src={file.url} alt="preview" style={{ maxWidth: 220, borderRadius: 8 }} />
        ) : null}
        <div className="admin-field-row">
          <div className="admin-field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="admin-field">
            <label>Alt</label>
            <input value={alt} onChange={(e) => setAlt(e.target.value)} />
          </div>
          <div className="admin-field">
            <label>Tags</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
        </div>
        <div className="admin-actions">
          <div className="admin-actions__buttons">
            <button type="button" className="admin-ghost" onClick={handleCopy}>
              Copy URL
            </button>
            <button type="button" className="admin-primary" onClick={handleSave}>
              Save Meta
            </button>
            <button type="button" className="admin-danger" onClick={() => onDelete(file.pathname)}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const refresh = useCallback(async () => {
    try {
      setStatus('');
      const res = await fetch('/api/media', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (e) {
      setStatus(e.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return files;
    return files.filter((f) =>
      [f.url, f.title, f.alt, (f.tags || []).join(',')].join(' ').toLowerCase().includes(needle)
    );
  }, [files, q]);

  const handleDelete = useCallback(async (pathname) => {
    if (!confirm('Delete this file?')) return;
    try {
      const res = await fetch(`/api/media?pathname=${encodeURIComponent(pathname)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Delete failed');
      setFiles((prev) => prev.filter((f) => f.pathname !== pathname));
    } catch (e) {
      setStatus(e.message);
    }
  }, []);

  const handleSaveMeta = useCallback(async (pathname, patch) => {
    try {
      const res = await fetch('/api/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathname, ...patch })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Update failed');
      setFiles((prev) => prev.map((f) => (f.pathname === pathname ? { ...f, ...patch } : f)));
    } catch (e) {
      setStatus(e.message);
    }
  }, []);

  return (
    <div className="admin-shell">
      <AdminNav />
      <header className="admin-shell__header">
        <div>
          <h1>Media Library</h1>
          <p>Browse, reuse, and manage uploaded assets.</p>
        </div>
        <div className="admin-field" style={{ minWidth: 280 }}>
          <label htmlFor="search">Search</label>
          <input id="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="title, tag, url…" />
        </div>
      </header>
      <section className="section-screen">
        {status && <p className="admin-status admin-status--error">{status}</p>}
        <ul className="entry-ledger">
          {filtered.map((file) => (
            <li key={file.pathname}>
              <FileCard file={file} onDelete={handleDelete} onSaveMeta={handleSaveMeta} />
            </li>
          ))}
          {!filtered.length && <p className="section-empty">No files yet</p>}
        </ul>
      </section>
    </div>
  );
}
