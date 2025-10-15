'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useAdminFetch } from './admin-session-context';

const MEDIA_PAGE_SIZE = 12;

export default function MediaSelector({ 
  value, 
  onChange, 
  placeholder = 'Select or paste image URL',
  label = 'Image',
  helpText,
  allowDirect = true // Allow direct URL input
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

  useEffect(() => {
    setDirectUrl(value || '');
  }, [value]);

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
        
        setMediaItems(prev => reset ? data.files : [...prev, ...data.files]);
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

  const toggleGallery = useCallback(() => {
    setIsOpen(previous => {
      const next = !previous;
      if (next && !hasLoadedMedia) {
        fetchMedia({ reset: true });
      }
      return next;
    });
  }, [fetchMedia, hasLoadedMedia]);

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
      setDirectUrl(item.url);
      onChange?.(item.url);
      setIsOpen(false);
    },
    [onChange]
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
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

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
              onClick={toggleGallery}
            >
              Browse Media
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

      {isOpen && (
        <div className="media-selector__modal" role="dialog" aria-modal="true">
          <div className="media-selector__modal-content">
            <header className="media-selector__header">
              <h3>Select Image from Media Gallery</h3>
              <button
                type="button"
                className="admin-ghost"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </header>

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
                  No media found. Upload images via the Media page.
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
      )}
    </div>
  );
}
