'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDisplayDate } from '../lib/formatters';
import { storeEntryReturnTarget } from '../lib/entryReturn';

const TRANSITION_DURATION_MS = 480;

export default function EntryDetail({ type, entry }) {
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

  if (!entry) return null;

  const { title, summary, content, tags, createdAt, coverImage } = entry;
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
            <h1 className="detail-view__title">{title}</h1>
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

        {coverImage?.url ? (
          <figure className="detail-view__media">
            <img
              src={coverImage.url}
              alt={coverImage.alt || `${title} cover image`}
              className="detail-view__media-image"
            />
          </figure>
        ) : null}

        <article className="detail-view__body">
          <div className="detail-view__content" dangerouslySetInnerHTML={{ __html: content }} />
        </article>
      </div>
    </div>
  );
}
