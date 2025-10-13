'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDisplayDate } from '../lib/formatters';
import { storeEntryReturnTarget } from '../lib/entryReturn';
import TabbedAudioPlayer from './TabbedAudioPlayer';
import { useLanguage } from '../contexts/LanguageContext';
import { t, getLocalizedContent } from '../lib/translations';

const TRANSITION_DURATION_MS = 480;

export default function EntryDetail({ type, entry, isAdmin = false }) {
  const router = useRouter();
  const { language } = useLanguage();
  const [stageState, setStageState] = useState('idle');
  const stageRef = useRef(null);
  const leaveTimeoutRef = useRef();
  const enterTimeoutRef = useRef();
  const stageStateRef = useRef('idle');

  const localizedContent = useMemo(() => getLocalizedContent(entry?.content, language) || '', [entry?.content, language]);

  const logLayoutMetrics = useCallback(
    (label, stateOverride) => {
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

    logLayoutMetrics('mount-before-enter', 'idle');

    setStageState('entering');
    logLayoutMetrics('mount-after-enter-set', 'entering');

    enterTimeoutRef.current = window.setTimeout(() => {
      logLayoutMetrics('timeout-before-visible', 'entering');
      setStageState('visible');
    }, TRANSITION_DURATION_MS);

    return () => {
      if (enterTimeoutRef.current) {
        clearTimeout(enterTimeoutRef.current);
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, [logLayoutMetrics]);

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
        router.push(href);
      }, TRANSITION_DURATION_MS);
    },
    [entry?.slug, router, stageState, type]
  );

  // Extract audio URLs from content for sound posts
  const audioData = useMemo(() => {
    if (type !== 'sounds' || !localizedContent) return null;
    
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
    
    // Remove the audio figure elements from content
    const parser = new DOMParser();
    const doc = parser.parseFromString(localizedContent, 'text/html');
    const audioFigures = doc.querySelectorAll('figure.sound-player');
    
    audioFigures.forEach(figure => {
      figure.remove();
    });
    
    return doc.body.innerHTML;
  }, [audioData, localizedContent, entry?.content]);

  if (!entry) return null;

  const { createdAt, coverImage } = entry;
  const localizedTitle = getLocalizedContent(entry.title, language) || entry.title;
  const localizedSummary = getLocalizedContent(entry.summary, language) || entry.summary;
  const dateLabel = createdAt ? formatDisplayDate(createdAt, language) : '';
  const editHref = entry?.slug ? `/administratorrrr?type=${type}&slug=${encodeURIComponent(entry.slug)}` : null;
  const stageClasses = ['detail-stage'];
  // Determine navigation label based on type
  const navTypeKey = type === 'words' ? 'content' : type;
  const typeLabel = navTypeKey ? t(`nav.${navTypeKey}`, language) : '';
  // Get the localized back button label
  const backButtonLabel = navTypeKey ? t(`nav.${navTypeKey}`, language) : '';

  if (stageState === 'entering') {
    stageClasses.push('is-fading-in');
  }
  if (stageState === 'visible') {
    stageClasses.push('is-visible');
  }
  if (stageState === 'leaving') {
    stageClasses.push('is-fading-out');
  }

  const stageClassName = stageClasses.join(' ');

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
          <div className="detail-view__stamps">
            {dateLabel && (
              <div className="detail-view__published">
                <span className="detail-view__published-label">{t('published.date', language)}</span>
                <span className="detail-view__published-date">{dateLabel}</span>
              </div>
            )}
            {typeLabel && <span className="detail-view__type-label">{typeLabel}</span>}
          </div>
        </nav>

        <header className="detail-view__header">
          <div className="detail-view__title-group">
            <div className="detail-view__title-row">
              <h1 className="detail-view__title">{localizedTitle}</h1>
              {isAdmin && editHref ? (
                <Link href={editHref} className="detail-view__edit-btn">
                  {t('edit.entry', language)}
                </Link>
              ) : null}
            </div>
            {localizedSummary ? <p className="detail-view__summary">{localizedSummary}</p> : null}
          </div>
        </header>

        {coverImage?.url && !audioData ? (
          <figure className="detail-view__media">
            <Image
              src={coverImage.url}
              alt={getLocalizedContent(coverImage.alt, language) || `${localizedTitle} cover image`}
              fill
              sizes="(max-width: 900px) 100vw, 960px"
              className="detail-view__media-image"
            />
          </figure>
        ) : null}

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
          <div className="detail-view__content" dangerouslySetInnerHTML={{ __html: processedContent || localizedContent || '' }} />
        </article>
      </div>
    </div>
  );
}
