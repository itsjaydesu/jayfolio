'use client';

import { formatDisplayDate } from '../lib/formatters';
import Link from 'next/link';
import Image from 'next/image';

/**
 * PostCard - A consistent, reusable card component for all content types
 * Features:
 * - Entire card is clickable via overlay
 * - Reduced height (approximately 50% of original)
 * - No explicit CTA links
 * - Supports all content types: words, projects, sounds
 * - Optimized for performance with proper error handling
 */
export default function PostCard({ 
  entry, 
  type = 'projects', // 'words', 'projects', 'sounds'
  tone = 'neutral',
  isAdmin = false,
  category = null,
  onClick = null
}) {
  // Validate required entry data
  if (!entry || !entry.slug) {
    console.error('[PostCard] Invalid entry data:', entry);
    return null;
  }

  const href = `/${type}/${entry.slug}`;
  const editHref = `/administratorrrr?type=${type}&slug=${encodeURIComponent(entry.slug)}`;
  
  // Determine figure aspect ratio based on type
  const getFigureClass = () => {
    const baseClass = 'project-entry__figure';
    switch(type) {
      case 'words':
        return `${baseClass} project-entry__figure--words`;
      case 'sounds':
        return `${baseClass} project-entry__figure--sounds`;
      default:
        return baseClass;
    }
  };

  // Handle click event for session storage (projects page)
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
    // Save scroll position for navigation return
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`${type}ScrollPosition`, window.scrollY.toString());
    }
  };

  return (
    <article
      className={`project-entry project-entry--${type}`}
      data-tone={tone}
      data-entry-slug={entry.slug}
    >
      <div className="project-entry__surface project-entry__surface--compact">
        <div className="project-entry__content">
          {/* Date and Category Header */}
          <div className="project-entry__header">
            {entry.createdAt && (
              <time className="project-entry__date" dateTime={entry.createdAt}>
                {formatDisplayDate(entry.createdAt).toUpperCase()}
              </time>
            )}
            {category && (
              <span className="project-entry__category">{category}</span>
            )}
          </div>

          {/* Main Content Body */}
          <div className="project-entry__body">
            {entry.tags?.length > 0 && (
              <p className="project-entry__tags">{entry.tags.join(' • ')}</p>
            )}
            
            <div className="project-entry__title-row">
              <h2 className="project-entry__title">{entry.title}</h2>
              {isAdmin && (
                <Link
                  href={editHref}
                  className="project-entry__edit-btn"
                  aria-label={`Edit ${entry.title}`}
                  // Prevent edit button click from triggering card navigation
                  onClick={(e) => e.stopPropagation()}
                >
                  Edit
                </Link>
              )}
            </div>
            
            {entry.summary && (
              <p className="project-entry__summary">{entry.summary}</p>
            )}
          </div>
        </div>

        {/* Visual/Figure Section */}
        <figure className={getFigureClass()} aria-hidden="true">
          {entry.coverImage?.url && type === 'projects' ? (
            <Image
              src={entry.coverImage.url}
              alt={entry.coverImage.alt || `${entry.title} cover image`}
              fill
              sizes="(max-width: 900px) 100vw, 420px"
              className="project-entry__image"
              onError={(e) => {
                // Fallback to gradient art on image load error
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div className="project-entry__art" />';
              }}
            />
          ) : (
            <div className="project-entry__art">
              {type === 'sounds' && <span className="project-entry__signal" />}
            </div>
          )}
        </figure>

        {/* Full Card Clickable Overlay */}
        <Link
          href={href}
          className="project-entry__overlay"
          aria-label={`View ${entry.title}`}
          onClick={handleCardClick}
        />
      </div>
    </article>
  );
}
