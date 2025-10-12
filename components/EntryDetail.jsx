'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDisplayDate } from '../lib/formatters';
import { storeEntryReturnTarget } from '../lib/entryReturn';
import TabbedAudioPlayer from './TabbedAudioPlayer';

const TRANSITION_DURATION_MS = 480;

export default function EntryDetail({ type, entry, isAdmin = false }) {
  const router = useRouter();
  const [stageState, setStageState] = useState('idle');
  const stageRef = useRef(null);
  const leaveTimeoutRef = useRef();
  const enterTimeoutRef = useRef();
  const stageStateRef = useRef('idle');

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
    if (type !== 'sounds' || !entry?.content) return null;
    
    // Parse the HTML content to find audio sources
    const parser = new DOMParser();
    const doc = parser.parseFromString(entry.content, 'text/html');
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
        title: entry.title,
        artist: 'Jay Winder', // You can make this configurable
        coverImage: entry.coverImage
      };
    }
    
    return null;
  }, [type, entry]);

  // Process content to remove audio elements if we're using the tabbed player
  const processedContent = useMemo(() => {
    if (!audioData || !entry?.content) return entry?.content;
    
    // Remove the audio figure elements from content
    const parser = new DOMParser();
    const doc = parser.parseFromString(entry.content, 'text/html');
    const audioFigures = doc.querySelectorAll('figure.sound-player');
    
    audioFigures.forEach(figure => {
      figure.remove();
    });
    
    return doc.body.innerHTML;
  }, [audioData, entry?.content]);

  if (!entry) return null;

  const { title, summary, content, tags, createdAt, coverImage } = entry;
  const editHref = entry?.slug ? `/administratorrrr?type=${type}&slug=${encodeURIComponent(entry.slug)}` : null;
  const dateLabel = createdAt ? formatDisplayDate(createdAt) : '';
  const stageClasses = ['detail-stage'];
  const typeLabel = type ? `${type.charAt(0).toUpperCase()}${type.slice(1)}` : '';

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
            Back to {type}
          </Link>
          <div className="detail-view__stamps">
            {typeLabel && <span>{typeLabel}</span>}
          </div>
        </nav>

        <header className="detail-view__header">
          <div className="detail-view__title-group">
            <div className="detail-view__title-row">
              <h1 className="detail-view__title">{title}</h1>
              {isAdmin && editHref ? (
                <Link href={editHref} className="detail-view__edit-btn">
                  Edit entry
                </Link>
              ) : null}
            </div>
            {summary ? <p className="detail-view__summary">{summary}</p> : null}
          </div>
          {(dateLabel || tags?.length) && (
            <div className="detail-view__meta" aria-label="Entry metadata">
              {dateLabel ? (
                <div className="detail-view__meta-item">
                  <span className="detail-view__meta-label">Published</span>
                  <span className="detail-view__meta-value">{dateLabel}</span>
                </div>
              ) : null}
              {tags?.length ? (
                <div className="detail-view__meta-item">
                  <span className="detail-view__meta-label">Tags</span>
                  <ul className="detail-view__meta-tags">
                    {tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </header>

        {coverImage?.url && !audioData ? (
          <figure className="detail-view__media">
            <Image
              src={coverImage.url}
              alt={coverImage.alt || `${title} cover image`}
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
          <div className="detail-view__content" dangerouslySetInnerHTML={{ __html: processedContent || content }} />
        </article>
      </div>
    </div>
  );
}
