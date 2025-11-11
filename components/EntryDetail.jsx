'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import { formatDisplayDate } from '../lib/formatters';
import { storeEntryReturnTarget } from '../lib/entryReturn';
import TabbedAudioPlayer from './TabbedAudioPlayer';
import { useLanguage } from '../contexts/LanguageContext';
import { t, getLocalizedContent } from '../lib/translations';
import { useAdminStatus } from '../lib/useAdminStatus';
import LanguageSwitcher from './LanguageSwitcher';
import 'react-photo-view/dist/react-photo-view.css';

const TRANSITION_DURATION_MS = 480;

export default function EntryDetail({ type, entry }) {
  const router = useRouter();
  const { language } = useLanguage();
  const { isAdmin } = useAdminStatus();
  const [stageState, setStageState] = useState('visible');
  const stageRef = useRef(null);
  const leaveTimeoutRef = useRef();
  const stageStateRef = useRef('visible');

  const localizedContent = useMemo(() => getLocalizedContent(entry?.content, language) || '', [entry?.content, language]);
  const localizedTitle = useMemo(() => getLocalizedContent(entry?.title, language) || entry?.title || '', [entry?.title, language]);

  const logLayoutMetrics = useCallback(
    (label, stateOverride) => {
      if (process.env.NODE_ENV !== 'development') return;
      if (typeof window === 'undefined') return;
      const stageNode = stageRef.current;
      if (!stageNode) return;

      const detailNode = stageNode.querySelector('.detail-view');
      const stageStyles = window.getComputedStyle(stageNode);
      const detailStyles = detailNode ? window.getComputedStyle(detailNode) : null;
      const stageRect = stageNode.getBoundingClientRect();
      const detailRect = detailNode?.getBoundingClientRect() ?? null;

      const activeState = stateOverride ?? stageStateRef.current;
      console.log('[EntryDetail layout]', label, {
        stageState: activeState,
        stageClassList: stageNode.className,
        stagePosition: stageStyles?.position,
        stageTop: stageStyles?.top,
        stageLeftCss: stageStyles?.left,
        stageRightCss: stageStyles?.right,
        stageLeft: stageRect?.left,
        stageWidth: stageRect?.width,
        detailLeft: detailRect?.left,
        detailWidth: detailRect?.width,
        viewportWidth: window.innerWidth,
        stageAlign: stageStyles?.alignItems,
        stageJustify: stageStyles?.justifyContent,
        detailMarginLeft: detailStyles?.marginLeft,
        detailMarginRight: detailStyles?.marginRight,
        detailTransform: detailStyles?.transform,
        detailDisplay: detailStyles?.display,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      });
    },
    []
  );

  useLayoutEffect(() => {
    const node = stageRef.current;
    if (node) {
      node.scrollTo({ top: 0, behavior: 'auto' });
    }

    logLayoutMetrics('mount-visible', 'visible');

    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, [logLayoutMetrics]);

  // Store the return target on mount so that using the browser back button
  // or any navigation method will still allow the list page to center the
  // last viewed entry. This is safe and lightweight; the list view consumes
  // and clears the value via EntryReturnFocus.
  useEffect(() => {
    if (!entry?.slug) return;
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[EntryDetail] mounting, will store return target', {
          type,
          slug: entry.slug,
          path: window.location.pathname
        });
      }
      storeEntryReturnTarget(type, entry.slug);
    } catch {
      // Ignore storage errors gracefully
    }
  }, [entry?.slug, type]);

  useEffect(() => {
    stageStateRef.current = stageState;
    logLayoutMetrics(`state-change-${stageState}`, stageState);
  }, [stageState, logLayoutMetrics]);

  const handleNavigateAway = useCallback(
    (event, href) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.button && event.button !== 0
      ) {
        return;
      }

      event.preventDefault();

      if (stageState === 'leaving') return;

      if (entry?.slug) {
        storeEntryReturnTarget(type, entry.slug);
      }

      setStageState('leaving');
      leaveTimeoutRef.current = window.setTimeout(() => {
        // Prevent Next.js from auto-scrolling the destination page to top.
        // Our list page handles centering via EntryReturnFocus.
        try {
          router.push(href, { scroll: false });
        } catch {
          router.push(href);
        }
      }, TRANSITION_DURATION_MS);
    },
    [entry?.slug, router, stageState, type]
  );

  // Extract audio URLs from content for sound posts
  const audioData = useMemo(() => {
    if (type !== 'sounds' || !localizedContent) return null;
    if (typeof window === 'undefined') {
      return null;
    }
    
    // Parse the HTML content to find audio sources
    const parser = new DOMParser();
    const doc = parser.parseFromString(localizedContent, 'text/html');
    const audioElements = doc.querySelectorAll('audio');
    
    let mp3Url = null;
    let losslessUrl = null;
    
    audioElements.forEach(audio => {
      const src = audio.getAttribute('src');
      if (src) {
        if (src.endsWith('.mp3')) {
          mp3Url = src;
        } else if (src.endsWith('.wav') || src.endsWith('.flac') || src.endsWith('.aiff')) {
          losslessUrl = src;
        }
      }
    });
    
    // Only return data if we have both formats
    if (mp3Url && losslessUrl) {
      return {
        mp3Url,
        losslessUrl,
        title: getLocalizedContent(entry?.title, language) || entry?.title || '',
        artist: 'Jay Winder', // You can make this configurable
        coverImage: entry.coverImage
      };
    }
    
    return null;
  }, [entry?.title, entry?.coverImage, language, localizedContent, type]);

  // Process content to remove audio elements if we're using the tabbed player
  const processedContent = useMemo(() => {
    if (!audioData || !localizedContent) return localizedContent || entry?.content;
    if (typeof window === 'undefined') {
      return localizedContent || entry?.content;
    }
    
    // Remove the audio figure elements from content
    const parser = new DOMParser();
    const doc = parser.parseFromString(localizedContent, 'text/html');
    const audioFigures = doc.querySelectorAll('figure.sound-player');
    
    audioFigures.forEach(figure => {
      figure.remove();
    });
    
    return doc.body.innerHTML;
  }, [audioData, localizedContent, entry?.content]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const galleries = useMemo(() => {
    const normalizeSettings = (input) => {
      const base = {
        columns: 4,
        spacing: 18,
        showArrows: true,
        toolbarView: 'visible'
      };

      if (!input || typeof input !== 'object') {
        return base;
      }

      const columnsRaw = Number.isFinite(input.columns) ? input.columns : Number.parseInt(input.columns, 10);
      if (Number.isFinite(columnsRaw) && columnsRaw > 0) {
        base.columns = Math.min(columnsRaw, 12);
      }

      const spacingRaw = Number.isFinite(input.spacing) ? input.spacing : Number.parseFloat(input.spacing);
      if (Number.isFinite(spacingRaw) && spacingRaw >= 0) {
        base.spacing = spacingRaw;
      }

      if (typeof input.showArrows === 'boolean') {
        base.showArrows = input.showArrows;
      }

      if (typeof input.toolbarView === 'string') {
        const trimmedToolbar = input.toolbarView.trim();
        if (['hidden', 'hover', 'visible'].includes(trimmedToolbar)) {
          base.toolbarView = trimmedToolbar;
        }
      }

      return base;
    };

    const normalizeImages = (input) => {
      if (!Array.isArray(input)) {
        return [];
      }
      return input
        .map((item) => {
          if (typeof item === 'string') {
            const url = item.trim();
            return url ? { url, thumbnail: url } : null;
          }
          if (item && typeof item === 'object' && typeof item.url === 'string') {
            const url = item.url.trim();
            if (!url) return null;
            const thumbnail =
              typeof item.thumbnailUrl === 'string' && item.thumbnailUrl.trim()
                ? item.thumbnailUrl.trim()
                : url;
            return { url, thumbnail };
          }
          return null;
        })
        .filter(Boolean);
    };

    const normalized = [];

    if (Array.isArray(entry?.galleries) && entry.galleries.length) {
      entry.galleries.forEach((gallery) => {
        if (!gallery || typeof gallery !== 'object') return;
        const images = normalizeImages(gallery.images);
        if (!images.length) return;
        normalized.push({
          images,
          settings: normalizeSettings(gallery.settings)
        });
      });
    } else if (Array.isArray(entry?.galleryImages) && entry.galleryImages.length) {
      const images = normalizeImages(entry.galleryImages);
      if (images.length) {
        normalized.push({
          images,
          settings: normalizeSettings(entry.gallerySettings)
        });
      }
    }

    return normalized;
  }, [entry?.galleries, entry?.galleryImages, entry?.gallerySettings]);

  const galleryTitleFallback = useMemo(() => {
    if (typeof localizedTitle === 'string' && localizedTitle.trim()) {
      return localizedTitle.trim();
    }
    const englishTitle = getLocalizedContent(entry?.title, 'en');
    if (typeof englishTitle === 'string' && englishTitle.trim()) {
      return englishTitle.trim();
    }
    if (typeof entry?.title === 'string' && entry.title.trim()) {
      return entry.title.trim();
    }
    return entry?.slug || 'Gallery';
  }, [entry?.slug, entry?.title, localizedTitle]);

  const contentHtml = useMemo(() => {
    const html = processedContent || localizedContent || '';
    return html.replace(/<\/image-gallery-\d+\s*>/gi, '');
  }, [localizedContent, processedContent]);

  const gallerySegments = useMemo(() => {
    const segments = [];
    const usedIndexes = [];
    if (!contentHtml) {
      return { segments, usedIndexes };
    }

    const regex = /<image-gallery-(\d+)\s*\/?>/gi;
    let lastIndex = 0;
    let match;

    const pruneEmptyParagraphs = (htmlChunk) =>
      htmlChunk.replace(/<p>[\s\u00A0]*<\/p>/gi, '').trim();

    while ((match = regex.exec(contentHtml)) !== null) {
      const index = match.index;
      if (index > lastIndex) {
        const htmlChunk = contentHtml.slice(lastIndex, index);
        if (pruneEmptyParagraphs(htmlChunk)) {
          segments.push({ type: 'html', content: htmlChunk });
        }
      }
      const galleryNumber = Number.parseInt(match[1], 10);
      if (!Number.isNaN(galleryNumber)) {
        const galleryIndex = galleryNumber - 1;
        usedIndexes.push(galleryIndex);
        segments.push({ type: 'gallery', galleryIndex });
      }
      lastIndex = regex.lastIndex;
    }

    const trailing = contentHtml.slice(lastIndex);
    if (pruneEmptyParagraphs(trailing)) {
      segments.push({ type: 'html', content: trailing });
    }

    if (!segments.length && pruneEmptyParagraphs(contentHtml)) {
      segments.push({ type: 'html', content: contentHtml });
    }

    return { segments, usedIndexes };
  }, [contentHtml]);

  const unusedGalleryIndexes = useMemo(() => {
    if (!galleries.length) {
      return [];
    }
    const usedSet = new Set(gallerySegments.usedIndexes);
    return galleries
      .map((_, index) => index)
      .filter((index) => !usedSet.has(index));
  }, [galleries, gallerySegments.usedIndexes]);

  const updateGalleryViewerState = useCallback((visible, settings) => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    if (!body) return;
    if (visible) {
      body.dataset.photoGalleryArrows = settings.showArrows ? 'on' : 'off';
      body.dataset.photoGalleryToolbar = settings.toolbarView;
    } else {
      delete body.dataset.photoGalleryArrows;
      delete body.dataset.photoGalleryToolbar;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof document === 'undefined') return;
      delete document.body.dataset.photoGalleryArrows;
      delete document.body.dataset.photoGalleryToolbar;
    };
  }, []);

  const getGalleryAriaLabel = useCallback((galleryIndex) => {
    const galleryNumber = galleryIndex + 1;
    if (language === 'ja') {
      return `${galleryTitleFallback} ギャラリー${galleryNumber}`;
    }
    return `${galleryTitleFallback} gallery ${galleryNumber}`;
  }, [galleryTitleFallback, language]);

  const getImageAriaLabel = useCallback((galleryIndex, imageIndex) => {
    const galleryNumber = galleryIndex + 1;
    const imageNumber = imageIndex + 1;
    if (language === 'ja') {
      return `${galleryTitleFallback} ギャラリー${galleryNumber}の写真 ${imageNumber}`;
    }
    return `${galleryTitleFallback} gallery ${galleryNumber} image ${imageNumber}`;
  }, [galleryTitleFallback, language]);

  const renderGallerySection = useCallback((galleryIndex, key) => {
    const gallery = galleries[galleryIndex];
    if (!gallery || !gallery.images.length) {
      return null;
    }

    const { images, settings } = gallery;
    const { columns, spacing, toolbarView } = settings;

    const gridStyle = {};
    if (Number.isFinite(columns) && columns > 0) {
      gridStyle.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
    }
    if (Number.isFinite(spacing) && spacing >= 0) {
      gridStyle.gap = `${spacing}px`;
    }

    const ariaLabel = getGalleryAriaLabel(galleryIndex);
    const toolbarShouldRender = toolbarView !== 'hidden';

    const renderToolbar = (toolbarProps) => {
      if (!toolbarShouldRender) {
        return null;
      }

      const { scale = 1, onScale, onClose } = toolbarProps;
      const clampScale = (nextScale) => {
        if (typeof onScale !== 'function') return;
        const clamped = Math.min(Math.max(nextScale, 0.5), 8);
        onScale(clamped);
      };

      const zoomOut = () => clampScale(scale - 0.4);
      const zoomIn = () => clampScale(scale + 0.4);
      const resetZoom = () => clampScale(1);

      const toggleFullscreen = () => {
        if (typeof document === 'undefined') return;
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
          return;
        }
        (document.documentElement || document.body)?.requestFullscreen?.();
      };

      return (
        <div className="detail-view__gallery-toolbar" role="toolbar" aria-label="Gallery controls">
          <button
            type="button"
            className="detail-view__gallery-toolbar-button"
            onClick={zoomOut}
            aria-label={language === 'ja' ? 'ズームアウト' : 'Zoom out'}
          >
            −
          </button>
          <button
            type="button"
            className="detail-view__gallery-toolbar-button"
            onClick={resetZoom}
            aria-label={language === 'ja' ? 'ズームリセット' : 'Reset zoom'}
          >
            1×
          </button>
          <button
            type="button"
            className="detail-view__gallery-toolbar-button"
            onClick={zoomIn}
            aria-label={language === 'ja' ? 'ズームイン' : 'Zoom in'}
          >
            ＋
          </button>
          <button
            type="button"
            className="detail-view__gallery-toolbar-button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? (language === 'ja' ? 'フルスクリーンを終了' : 'Exit fullscreen') : (language === 'ja' ? 'フルスクリーン' : 'Enter fullscreen')}
          >
            ⤢
          </button>
          <button
            type="button"
            className="detail-view__gallery-toolbar-button"
            onClick={() => onClose?.()}
            aria-label={language === 'ja' ? '閉じる' : 'Close viewer'}
          >
            ×
          </button>
        </div>
      );
    };

    return (
      <section key={key} className="detail-view__gallery" aria-label={ariaLabel}>
        <PhotoProvider
          maskOpacity={0.92}
          bannerVisible={toolbarView !== 'hidden'}
          speed={(type) => (type === 2 ? 280 : 320)}
          easing={() => 'cubic-bezier(0.22, 1, 0.36, 1)'}
          className="detail-view__gallery-provider"
          maskClassName="detail-view__gallery-mask"
          onVisibleChange={(visible) => updateGalleryViewerState(visible, settings)}
          toolbarRender={toolbarShouldRender ? renderToolbar : undefined}
        >
          <ul className="detail-view__gallery-grid" style={gridStyle}>
            {images.map((image, imageIndex) => {
              const ariaLabelForImage = getImageAriaLabel(galleryIndex, imageIndex);
              return (
                <li key={`${image.url}-${imageIndex}`} className="detail-view__gallery-item">
                  <PhotoView src={image.url}>
                    <button
                      type="button"
                      className="detail-view__gallery-thumb"
                      aria-label={ariaLabelForImage}
                    >
                      <img
                        src={image.thumbnail}
                        alt=""
                        loading="lazy"
                        className="detail-view__gallery-image"
                      />
                    </button>
                  </PhotoView>
                </li>
              );
            })}
          </ul>
        </PhotoProvider>
      </section>
    );
  }, [galleries, getGalleryAriaLabel, getImageAriaLabel, isFullscreen, language, updateGalleryViewerState]);

  if (!entry) return null;

  const { createdAt, coverImage } = entry;
  const localizedSummary = getLocalizedContent(entry.summary, language) || entry.summary;
  const dateLabel = createdAt ? formatDisplayDate(createdAt, language) : '';
  const editHref = entry?.slug
    ? `/administratorrrr?type=${type}&slug=${encodeURIComponent(entry.slug)}&panel=collapsed`
    : null;
  const stageClasses = ['detail-stage'];
  const titleGroupClasses = ['detail-view__title-group'];
  if (isAdmin && editHref) {
    titleGroupClasses.push('detail-view__title-group--editable');
  }
  // Determine navigation label based on type
  const navTypeKey = type === 'words' ? 'content' : type;
  const typeLabel = navTypeKey ? t(`nav.${navTypeKey}`, language) : '';
  // Get the localized back button label
  const backButtonLabel = navTypeKey ? t(`nav.${navTypeKey}`, language) : '';

  stageClasses.push('is-visible');
  if (stageState === 'leaving') {
    stageClasses.push('is-fading-out');
  }

  const stageClassName = stageClasses.join(' ');
  const hasLeadMedia = Boolean(coverImage?.url) && !audioData;

  return (
    <div className={stageClassName} ref={stageRef}>
      <div className={`detail-view detail-view--${type}`}>
        <nav className="detail-view__nav" aria-label="Detail navigation">
          <Link
            href={`/${type}`}
            className="detail-view__back"
            onClick={(event) => handleNavigateAway(event, `/${type}`)}
          >
            {t('back.to', language, { section: backButtonLabel })}
          </Link>
          <div className="detail-view__nav-actions">
            <div className="detail-view__stamps">
              {dateLabel && (
                <div className="detail-view__published">
                  <span className="detail-view__published-label">{t('published.date', language)}</span>
                  <span className="detail-view__published-date">{dateLabel}</span>
                </div>
              )}
              {typeLabel && <span className="detail-view__type-label">{typeLabel}</span>}
            </div>
            <LanguageSwitcher className="detail-view__language-toggle" />
          </div>
        </nav>

        <section
          className="detail-view__lead"
          data-has-media={hasLeadMedia ? 'true' : 'false'}
          aria-labelledby="detail-view-title"
        >
          <header className="detail-view__header">
            <div className={titleGroupClasses.join(' ')}>
              <div className="detail-view__title-row">
                <h1 id="detail-view-title" className="detail-view__title">
                  {localizedTitle}
                </h1>
                {isAdmin && editHref ? (
                  <Link href={editHref} className="detail-view__edit-btn">
                    {t('edit.entry', language)}
                  </Link>
                ) : null}
              </div>
              {localizedSummary ? <p className="detail-view__summary">{localizedSummary}</p> : null}
            </div>
          </header>

          {hasLeadMedia ? (
            <figure className="detail-view__media">
              <Image
                src={coverImage.url}
                alt={
                  getLocalizedContent(coverImage.alt, language) || `${localizedTitle} cover image`
                }
                fill
                sizes="(max-width: 1024px) 100vw, 720px"
                className="detail-view__media-image"
                style={{ objectFit: 'cover', objectPosition: 'center', borderRadius: 'inherit' }}
              />
            </figure>
          ) : null}
        </section>

        {audioData && (
          <TabbedAudioPlayer
            title={audioData.title}
            artist={audioData.artist}
            coverImage={audioData.coverImage}
            mp3Url={audioData.mp3Url}
            losslessUrl={audioData.losslessUrl}
            className="detail-view__audio-player"
          />
        )}

        <article className="detail-view__body">
          {gallerySegments.segments.map((segment, index) => {
            if (segment.type === 'html') {
              const htmlChunk = segment.content;
              if (!htmlChunk || !htmlChunk.trim()) {
                return null;
              }
              return (
                <div
                  key={`detail-html-${index}`}
                  className="detail-view__content"
                  dangerouslySetInnerHTML={{ __html: htmlChunk }}
                />
              );
            }

            if (segment.type === 'gallery') {
              return renderGallerySection(segment.galleryIndex, `detail-gallery-${index}`);
            }

            return null;
          })}

          {gallerySegments.usedIndexes.length
            ? unusedGalleryIndexes.map((galleryIndex) =>
                renderGallerySection(galleryIndex, `detail-gallery-tail-${galleryIndex}`)
              )
            : null}
        </article>
      </div>
    </div>
  );
}
