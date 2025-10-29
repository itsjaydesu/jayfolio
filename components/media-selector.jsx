'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useAdminFetch } from './admin-session-context';

const MEDIA_PAGE_SIZE = 12;
const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/'];
const ALLOWED_MIME_TYPES = new Set([
  'application/zip',
  'application/pdf',
  'application/json',
  'text/plain',
  'text/markdown'
]);
const ALLOWED_EXTENSIONS = ['.zip', '.pdf', '.txt', '.md', '.json'];

function normalizeUploadedRecord(payload, file) {
  const displayName = typeof file?.name === 'string' ? file.name.trim() : '';
  const fallbackTitle = displayName
    ? displayName.replace(/\.[^/.]+$/, '')
    : payload.pathname || 'Uploaded asset';

  return {
    title: fallbackTitle,
    alt: '',
    createdAt: payload.createdAt || new Date().toISOString(),
    ...payload
  };
}

function validateUploadFile(file) {
  if (!file) return 'No file selected';
  if (file.size > MAX_UPLOAD_SIZE) {
    return 'File too large. Maximum size is 25 MB.';
  }
  const type = file.type || '';
  if (ALLOWED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix))) {
    return null;
  }
  if (ALLOWED_MIME_TYPES.has(type)) {
    return null;
  }
  const lowerName = (file.name || '').toLowerCase();
  if (ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
    return null;
  }
  return 'Unsupported file type. Upload images, audio, video, zip, PDF, JSON, or plain text.';
}

export default function MediaSelector({
  value,
  onChange,
  placeholder = 'Select or paste image URL',
  label = 'Image',
  helpText,
  allowDirect = true, // Allow direct URL input
  allowUpload = true // Enable inline uploads by default
}) {
  const adminFetch = useAdminFetch();
  const [isOpen, setIsOpen] = useState(false);
  const [directUrl, setDirectUrl] = useState(value || '');
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaOffset, setMediaOffset] = useState(0);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [hasLoadedMedia, setHasLoadedMedia] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadError, setUploadError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [portalTarget, setPortalTarget] = useState(null);

  const isUploading = uploadStatus === 'uploading';

  useEffect(() => {
    setDirectUrl(value || '');
  }, [value]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalTarget(document.body);
    }
  }, []);

  const fetchMedia = useCallback(
    async ({ reset = false, searchTerm } = {}) => {
      setIsLoadingMedia(true);
      setMediaError('');
      const appliedSearch = searchTerm ?? mediaSearch;
      const offset = reset ? 0 : mediaOffset;

      try {
        const params = new URLSearchParams();
        params.set('limit', MEDIA_PAGE_SIZE.toString());
        params.set('offset', offset.toString());
        if (appliedSearch.trim()) {
          params.set('search', appliedSearch.trim());
        }

        const response = await adminFetch(`/api/media?${params.toString()}`, { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load media');
        }

        setMediaItems((previous) => (reset ? data.files : [...previous, ...data.files]));
        setMediaOffset(data.nextOffset ?? offset + data.files.length);
        setHasMoreMedia(Boolean(data.hasMore));
        setHasLoadedMedia(true);
      } catch (fetchError) {
        setMediaError(fetchError?.message || 'Failed to load media');
      } finally {
        setIsLoadingMedia(false);
      }
    },
    [adminFetch, mediaOffset, mediaSearch]
  );

  const openModal = useCallback(() => {
    setIsOpen(true);
    if (!hasLoadedMedia) {
      fetchMedia({ reset: true });
    }
  }, [fetchMedia, hasLoadedMedia]);

  const closeModal = useCallback(() => {
    if (isUploading) return;
    setIsOpen(false);
  }, [isUploading]);

  const handleSearchChange = useCallback((event) => {
    setMediaSearch(event.target.value);
  }, []);

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      fetchMedia({ reset: true, searchTerm: mediaSearch });
    },
    [fetchMedia, mediaSearch]
  );

  const handleClearSearch = useCallback(() => {
    setMediaSearch('');
    fetchMedia({ reset: true, searchTerm: '' });
  }, [fetchMedia]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMedia || !hasMoreMedia) return;
    fetchMedia({ reset: false });
  }, [fetchMedia, hasMoreMedia, isLoadingMedia]);

  const handleSelectImage = useCallback(
    (item) => {
      if (isUploading) return;
      setDirectUrl(item.url);
      onChange?.(item.url);
      closeModal();
    },
    [closeModal, isUploading, onChange]
  );

  const handleDirectUrlChange = useCallback(
    (event) => {
      const url = event.target.value;
      setDirectUrl(url);
      onChange?.(url);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setDirectUrl('');
    onChange?.('');
  }, [onChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeModal, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof document === 'undefined') return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setUploadStatus('idle');
      setUploadError('');
      setIsDragActive(false);
    }
  }, [isOpen]);

  const handleUploadClick = useCallback(() => {
    if (isUploading) return;
    setUploadError('');
    fileInputRef.current?.click();
  }, [isUploading]);

  const processUpload = useCallback(
    async (file) => {
      if (!file || isUploading) return;
      const validationMessage = validateUploadFile(file);
      if (validationMessage) {
        setUploadError(validationMessage);
        setUploadStatus('error');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      setUploadStatus('uploading');
      setUploadError('');

      try {
        const response = await adminFetch('/api/upload', {
          method: 'POST',
          body: formData,
          cache: 'no-store'
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Upload failed');
        }

        const normalized = normalizeUploadedRecord(data, file);

        setMediaItems((previous) => {
          const withoutDuplicate = previous.filter((item) => item.pathname !== normalized.pathname);
          return [normalized, ...withoutDuplicate];
        });
        setMediaOffset((previous) => (Number.isFinite(previous) ? previous + 1 : 1));
        setHasLoadedMedia(true);
        setHasMoreMedia(true);
        setDirectUrl(normalized.url);
        onChange?.(normalized.url);
        setUploadStatus('success');
        window.setTimeout(() => {
          setUploadStatus('idle');
          closeModal();
        }, 250);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        setUploadError(message);
        setUploadStatus('error');
      }
    },
    [adminFetch, closeModal, isUploading, onChange]
  );

  const handleFileInputChange = useCallback(
    (event) => {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (!files.length) return;
      processUpload(files[0]);
    },
    [processUpload]
  );

  const handleDragEnter = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isUploading) return;
    setIsDragActive(true);
  }, [isUploading]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);
      if (isUploading) return;
      const files = Array.from(event.dataTransfer?.files || []);
      if (!files.length) return;
      processUpload(files[0]);
    },
    [isUploading, processUpload]
  );

  const modalContent = useMemo(() => {
    if (!isOpen) return null;

    return (
      <div className="media-selector__modal" role="dialog" aria-modal="true">
        <div className="media-selector__modal-content">
          <header className="media-selector__header">
            <h3>Select Image from Media Gallery</h3>
            <button
              type="button"
              className="admin-ghost"
              onClick={closeModal}
              disabled={isUploading}
            >
              Close
            </button>
          </header>

          {allowUpload && (
            <div
              className={`media-selector__upload${isDragActive ? ' media-selector__upload--active' : ''}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="media-selector__upload-input"
                onChange={handleFileInputChange}
                tabIndex={-1}
              />
              <div className="media-selector__upload-body">
                <p className="media-selector__upload-title">Upload new media</p>
                <p className="media-selector__upload-help">
                  Drop a file here or browse to upload images, audio, video, or documents.
                </p>
                <div className="media-selector__upload-actions">
                  <button
                    type="button"
                    className="admin-primary"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading…' : 'Choose File'}
                  </button>
                  <span className="media-selector__upload-separator">or drag &amp; drop</span>
                </div>
                <p className="media-selector__upload-meta">Max size 25 MB</p>
              </div>
              {uploadError && (
                <p className="media-selector__upload-error" role="alert">
                  {uploadError}
                </p>
              )}
            </div>
          )}

          <form className="media-selector__search" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              value={mediaSearch}
              onChange={handleSearchChange}
              placeholder="Search media..."
              aria-label="Search media"
            />
            <button type="submit" className="admin-primary" disabled={isLoadingMedia}>
              Search
            </button>
            {mediaSearch && (
              <button
                type="button"
                className="admin-ghost"
                onClick={handleClearSearch}
                disabled={isLoadingMedia}
              >
                Clear
              </button>
            )}
          </form>

          <div className="media-selector__grid">
            {isLoadingMedia && !mediaItems.length ? (
              <p className="media-selector__empty">Loading media...</p>
            ) : mediaItems.length ? (
              mediaItems.map((item) => (
                <button
                  type="button"
                  key={item.pathname}
                  className="media-selector__item"
                  onClick={() => handleSelectImage(item)}
                >
                  <div className="media-selector__thumb">
                    <Image
                      src={item.url}
                      alt={item.alt || item.title || 'Media item'}
                      fill
                      sizes="150px"
                      className="media-selector__thumb-image"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <span className="media-selector__item-name">
                    {item.title || item.alt || item.pathname}
                  </span>
                </button>
              ))
            ) : (
              <p className="media-selector__empty">
                No media found. {allowUpload ? 'Upload a new file above to get started.' : 'Upload images via the Media page.'}
              </p>
            )}
          </div>

          {mediaError && (
            <p className="media-selector__error">{mediaError}</p>
          )}

          {hasMoreMedia && (
            <div className="media-selector__footer">
              <button
                type="button"
                className="admin-ghost"
                onClick={handleLoadMore}
                disabled={isLoadingMedia}
              >
                {isLoadingMedia ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }, [
    allowUpload,
    closeModal,
    handleClearSearch,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInputChange,
    handleLoadMore,
    handleSearchChange,
    handleSearchSubmit,
    handleSelectImage,
    handleUploadClick,
    hasMoreMedia,
    isDragActive,
    isLoadingMedia,
    isOpen,
    isUploading,
    mediaError,
    mediaItems,
    mediaSearch,
    uploadError
  ]);

  return (
    <div className="media-selector">
      <div className="media-selector__field">
        <label>{label}</label>
        <div className="media-selector__input-group">
          {allowDirect ? (
            <input
              type="url"
              value={directUrl}
              onChange={handleDirectUrlChange}
              placeholder={placeholder}
              className="media-selector__input"
            />
          ) : (
            <div className="media-selector__readonly">
              {directUrl || <span className="media-selector__placeholder">{placeholder}</span>}
            </div>
          )}
          <div className="media-selector__actions">
            <button
              type="button"
              className="admin-ghost"
              onClick={isOpen ? closeModal : openModal}
              disabled={isUploading}
            >
              {isOpen ? 'Close' : 'Browse Media'}
            </button>
            {directUrl && (
              <button
                type="button"
                className="admin-ghost"
                onClick={handleClear}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        {helpText && <small className="media-selector__help">{helpText}</small>}
      </div>

      {directUrl && (
        <div className="media-selector__preview">
          <Image
            src={directUrl}
            alt="Selected image"
            width={200}
            height={120}
            className="media-selector__preview-image"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

      {isOpen && portalTarget && createPortal(modalContent, portalTarget)}
    </div>
  );
}
