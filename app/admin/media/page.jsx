'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminNav from '../../../components/admin-nav';

const numberFormatter = new Intl.NumberFormat('en-US');

function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }
  const bytesLabel = `${numberFormatter.format(bytes)} bytes`;
  if (bytes < 1024) {
    return { primary: bytesLabel };
  }
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    const precision = kilobytes < 10 ? 2 : kilobytes < 100 ? 1 : 0;
    const primary = `${kilobytes.toFixed(precision)} KB`;
    return { primary, secondary: bytesLabel };
  }
  const megabytes = kilobytes / 1024;
  const primary = `${megabytes.toFixed(megabytes < 10 ? 2 : 1)} MB`;
  const secondary = `${numberFormatter.format(Math.round(kilobytes))} KB • ${bytesLabel}`;
  return { primary, secondary };
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
  const [resolvedSize, setResolvedSize] = useState(() =>
    typeof file.size === 'number' && Number.isFinite(file.size) ? file.size : null
  );
  const [sizeStatus, setSizeStatus] = useState(() => (resolvedSize ? 'loaded' : 'idle'));
  const [sizeError, setSizeError] = useState('');
  const sizePersistedRef = useRef(typeof file.size === 'number' && Number.isFinite(file.size));
  const formattedSize = useMemo(() => formatFileSize(resolvedSize), [resolvedSize]);
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

  useEffect(() => {
    if (typeof file.size === 'number' && Number.isFinite(file.size)) {
      sizePersistedRef.current = true;
      setResolvedSize(file.size);
      setSizeStatus('loaded');
      setSizeError('');
    } else if (!resolvedSize) {
      sizePersistedRef.current = false;
      setSizeStatus('idle');
    }
  }, [file.size, resolvedSize]);

  useEffect(() => {
    if (resolvedSize !== null || !file.url || sizeStatus !== 'idle') {
      return;
    }

    let ignore = false;
    const controller = new AbortController();

    async function detectSize() {
      setSizeStatus('loading');
      setSizeError('');

      try {
        const response = await fetch(file.url, { method: 'HEAD', signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const header = response.headers.get('content-length');
        const parsed = header ? Number(header) : NaN;
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error('Missing content-length header');
        }
        if (ignore) return;
        setResolvedSize(parsed);

        if (!sizePersistedRef.current) {
          setSizeStatus('saving');
          try {
            await onSaveMeta(file.pathname, { size: parsed });
            sizePersistedRef.current = true;
            setSizeStatus('loaded');
          } catch (persistError) {
            console.warn('[media] failed to persist size', persistError);
            if (!ignore) {
              setSizeStatus('loaded');
              setSizeError('Detected size but could not sync metadata. Try saving manually.');
            }
          }
        } else {
          setSizeStatus('loaded');
        }
      } catch (error) {
        console.warn('[media] size detection failed', error);
        if (!ignore) {
          setSizeStatus('error');
          setSizeError('Could not determine file size automatically.');
        }
      }
    }

    detectSize();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [file.url, file.pathname, onSaveMeta, resolvedSize, sizeStatus]);

  const handleRetrySize = useCallback(() => {
    setSizeError('');
    if (typeof file.size === 'number' && Number.isFinite(file.size)) {
      sizePersistedRef.current = true;
      setResolvedSize(file.size);
      setSizeStatus('loaded');
      return;
    }
    sizePersistedRef.current = false;
    setResolvedSize(null);
    setSizeStatus('idle');
  }, [file.size]);

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
            <dd>
              {sizeStatus === 'loading' ? <span className="media-card__meta-status">Detecting…</span> : null}
              {sizeStatus === 'saving' ? <span className="media-card__meta-status">Syncing…</span> : null}
              {sizeStatus === 'error' ? (
                <>
                  <span className="media-card__meta-status media-card__meta-status--error">Size unavailable</span>
                  {sizeError ? <span className="media-card__meta-footnote">{sizeError}</span> : null}
                  <button type="button" className="media-card__meta-button" onClick={handleRetrySize}>
                    Retry size lookup
                  </button>
                </>
              ) : null}
              {sizeStatus !== 'loading' && sizeStatus !== 'saving' && sizeStatus !== 'error' ? (
                <>
                  <span>{formattedSize?.primary || 'Size unavailable'}</span>
                  {formattedSize?.secondary ? (
                    <span className="media-card__meta-footnote">{formattedSize.secondary}</span>
                  ) : null}
                  {!formattedSize && (
                    <button type="button" className="media-card__meta-button" onClick={handleRetrySize}>
                      Retry size lookup
                    </button>
                  )}
                  {sizeError ? (
                    <span className="media-card__meta-footnote media-card__meta-footnote--warning">{sizeError}</span>
                  ) : null}
                </>
              ) : null}
            </dd>
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
