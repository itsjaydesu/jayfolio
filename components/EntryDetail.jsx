'use client';

import Link from 'next/link';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDisplayDate } from '../lib/formatters';

const TRANSITION_DURATION_MS = 480;

export default function EntryDetail({ type, entry }) {
  const router = useRouter();
  const [stageState, setStageState] = useState('idle');
  const stageRef = useRef(null);
  const leaveTimeoutRef = useRef();
  const enterTimeoutRef = useRef();

  useLayoutEffect(() => {
    const node = stageRef.current;
    if (node) {
      node.scrollTo({ top: 0, behavior: 'auto' });
    }

    setStageState('entering');
    enterTimeoutRef.current = window.setTimeout(() => {
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
  }, []);

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

      setStageState('leaving');
      leaveTimeoutRef.current = window.setTimeout(() => {
        router.push(href);
      }, TRANSITION_DURATION_MS);
    },
    [router, stageState]
  );

  if (!entry) return null;

  const { title, summary, content, tags, createdAt } = entry;
  const dateLabel = createdAt ? formatDisplayDate(createdAt) : '';
  const stageClasses = ['detail-stage'];

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
        <header className="detail-view__header">
          <nav className="detail-view__nav" aria-label="Detail navigation">
            <Link
              href={`/${type}`}
              className="detail-view__back"
              onClick={(event) => handleNavigateAway(event, `/${type}`)}
            >
              Back to {type}
            </Link>
            <div className="detail-view__stamps">
              {dateLabel && <span>{dateLabel}</span>}
              {tags?.length ? <span>{tags.join(' • ')}</span> : null}
            </div>
          </nav>
          <div className="detail-view__intro">
            <h1>{title}</h1>
            {summary && <p>{summary}</p>}
          </div>
        </header>
        <article className="detail-view__body">
          <div className="detail-view__content" dangerouslySetInnerHTML={{ __html: content }} />
        </article>
      </div>
    </div>
  );
}
