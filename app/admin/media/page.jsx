'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminNav from '../../../components/admin-nav';

const numberFormatter = new Intl.NumberFormat('en-US');

function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) {
    return 'Size unknown';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kilobytes = bytes / 1024;
  const roundedKb = numberFormatter.format(Math.round(kilobytes));
  if (kilobytes < 1024) {
    const precision = kilobytes < 10 ? 2 : kilobytes < 100 ? 1 : 0;
    return `${kilobytes.toFixed(precision)} KB`;
  }
  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(megabytes < 10 ? 2 : 1)} MB (${roundedKb} KB)`;
}

function formatTimestamp(isoValue) {
  if (!isoValue) return '';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function deriveDisplayName(file) {
  if (file?.title && file.title.trim()) return file.title.trim();
  const source = file?.pathname || file?.url || '';
  if (!source) return 'Untitled asset';
  const clean = source.split('/').pop() || source;
  return clean.trim() || 'Untitled asset';
}

function FileCard({ file, onDelete, onSaveMeta }) {
  const [title, setTitle] = useState(file.title || '');
  const [alt, setAlt] = useState(file.alt || '');
  const [tags, setTags] = useState((file.tags || []).join(', '));
  const isImage = file.type?.startsWith('image/');
  const isVideo = file.type?.startsWith('video/');
  const isAudio = file.type?.startsWith('audio/');
  const formattedSize = useMemo(() => formatFileSize(file.size), [file.size]);
  const uploadedAt = useMemo(() => formatTimestamp(file.createdAt), [file.createdAt]);
  const displayName = useMemo(() => deriveDisplayName({ ...file, title }), [file, title]);
  const tagPills = useMemo(
    () =>
      tags
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean),
    [tags]
  );

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
    <article className="media-card">
      <div className="media-card__visual">
        {isImage ? (
          <div className="media-card__image">
            <Image
              src={file.url}
              alt={alt || file.alt || displayName}
              fill
              sizes="(max-width: 900px) 100vw, 320px"
            />
          </div>
        ) : (
          <div
            className={`media-card__placeholder${isVideo ? ' media-card__placeholder--video' : ''}${
              isAudio ? ' media-card__placeholder--audio' : ''
            }`}
            role="presentation"
          >
            <span aria-hidden>{isVideo ? '🎞️' : isAudio ? '🎵' : '📄'}</span>
          </div>
        )}
      </div>
      <div className="media-card__body">
        <header className="media-card__header">
          <div className="media-card__title">
            <h2>{displayName}</h2>
            <p>{file.pathname}</p>
          </div>
          <div className="media-card__actions media-card__actions--compact">
            <button type="button" className="admin-ghost" onClick={handleCopy}>
              Copy URL
            </button>
            <a href={file.url} target="_blank" rel="noreferrer" className="admin-ghost">
              Open
            </a>
          </div>
        </header>
        <dl className="media-card__meta">
          <div>
            <dt>Size</dt>
            <dd>{formattedSize}</dd>
          </div>
          {file.type ? (
            <div>
              <dt>Type</dt>
              <dd>{file.type}</dd>
            </div>
          ) : null}
          {uploadedAt ? (
            <div>
              <dt>Uploaded</dt>
              <dd>{uploadedAt}</dd>
            </div>
          ) : null}
        </dl>
        {tagPills.length ? (
          <ul className="media-card__tags">
            {tagPills.map((tag, index) => (
              <li key={`${tag}-${index}`}>{tag}</li>
            ))}
          </ul>
        ) : null}
        <div className="media-card__fields">
          <div className="admin-field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="admin-field">
            <label>Alt text</label>
            <input value={alt} onChange={(e) => setAlt(e.target.value)} />
          </div>
          <div className="admin-field">
            <label>Tags</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma separated" />
          </div>
        </div>
        <footer className="media-card__actions">
          <button type="button" className="admin-primary" onClick={handleSave}>
            Save Meta
          </button>
          <button type="button" className="admin-danger" onClick={() => onDelete(file.pathname)}>
            Delete
          </button>
        </footer>
      </div>
    </article>
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
        {filtered.length ? (
          <div className="media-library__grid">
            {filtered.map((file) => (
              <FileCard key={file.pathname} file={file} onDelete={handleDelete} onSaveMeta={handleSaveMeta} />
            ))}
          </div>
        ) : (
          <p className="section-empty">No files yet</p>
        )}
      </section>
    </div>
  );
}
