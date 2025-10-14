'use client';

import { formatDisplayDate } from '../lib/formatters';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../contexts/LanguageContext';
import { getCategoryName, getLocalizedContent, getLocalizedTags, t } from '../lib/translations';

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
  type = 'projects', // 'content', 'projects', 'sounds', 'art'
  tone = 'neutral',
  isAdmin = false,
  category = null,
  onClick = null
}) {
  const { language } = useLanguage();
  // Validate required entry data
  if (!entry || !entry.slug) {
    console.error('[PostCard] Invalid entry data:', entry);
    return null;
  }

  const href = `/${type}/${entry.slug}`;
  const editHref = `/administratorrrr?type=${type}&slug=${encodeURIComponent(entry.slug)}&panel=collapsed`;

  const localizedTitle = getLocalizedContent(entry.title, language) || entry.title;
  const localizedSummary = getLocalizedContent(entry.summary, language) || entry.summary;
  const formattedDate = entry.createdAt ? formatDisplayDate(entry.createdAt, language) : '';
  const displayDate = language === 'en' ? formattedDate.toUpperCase() : formattedDate;
  const localizedTags = getLocalizedTags(entry.tags, language);
  const coverAlt = entry.coverImage ? getLocalizedContent(entry.coverImage.alt, language) : '';
  
  // Determine figure aspect ratio based on type
  const getFigureClass = () => {
    const baseClass = 'project-entry__figure';
    switch(type) {
      case 'content':
      case 'words': // Keep for backward compatibility
        return `${baseClass} project-entry__figure--words`;
      case 'sounds':
        return `${baseClass} project-entry__figure--sounds`;
      case 'art':
        return `${baseClass} project-entry__figure--art`;
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

  // Map content type to words for CSS classes (backward compatibility)
  const cssType = type === 'content' ? 'words' : type;

  const surfaceClasses = ['project-entry__surface', 'project-entry__surface--compact'];
  if (isAdmin) {
    surfaceClasses.push('project-entry__surface--with-edit');
  }

  return (
    <article
      className={`project-entry project-entry--${cssType}`}
      data-tone={tone}
      data-entry-slug={entry.slug}
    >
      <div className={surfaceClasses.join(' ')}>
        {isAdmin ? (
          <Link
            href={editHref}
            prefetch
            className="project-entry__edit-btn"
            aria-label={`${t('admin.edit', language)} ${localizedTitle}`}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            {t('admin.edit', language)}
          </Link>
        ) : null}
        <div className="project-entry__content">
          <header className="project-entry__header">
            <div className="project-entry__meta">
              {entry.createdAt && (
                <time className="project-entry__date" dateTime={entry.createdAt}>
                  {displayDate}
                </time>
              )}
              {category && (
                <span className="project-entry__category">
                  {getCategoryName(category, language)}
                </span>
              )}
            </div>

            <div className="project-entry__title-row">
              <h2 className="project-entry__title">{localizedTitle}</h2>
            </div>
          </header>

          {localizedSummary && (
            <p className="project-entry__summary">{localizedSummary}</p>
          )}

          {localizedTags.length > 0 && (
            <ul className="project-entry__tags">
              {localizedTags.map((tag, index) => (
                <li key={`${entry.slug}-tag-${index}`}>{tag}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Visual/Figure Section */}
        <figure className={getFigureClass()} aria-hidden="true">
          {entry.coverImage?.url && type === 'projects' ? (
            <Image
              src={entry.coverImage.url}
            alt={coverAlt || `${localizedTitle} cover image`}
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
          aria-label={t('post.view', language, { title: localizedTitle })}
          onClick={handleCardClick}
        />
      </div>
    </article>
  );
}
