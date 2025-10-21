
'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAdminStatus } from '../../lib/useAdminStatus';
import { getLocalizedContent, getLocalizedTags } from '../../lib/translations';

const FALLBACK_TITLE = 'About';
const FALLBACK_SUBTITLE = 'Creative Technologist';
const EMPTY_STATE_TEXT = 'About details are coming soon.';

const BLOCK_LEVEL_HTML_PATTERN = /<\/?(p|ul|ol|li|blockquote|h[1-6]|section|article|div|figure)[\s>]/i;
const LEGACY_TAG_SEPARATOR = /[•,|/\n]+/;

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildParagraphs(rawContent) {
  const source = normalizeText(rawContent);
  if (!source) {
    return [];
  }

  if (BLOCK_LEVEL_HTML_PATTERN.test(source)) {
    return [{ html: source, isBlock: true }];
  }

  const segments = source
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const normalizedSegments = segments.length ? segments : [source];

  return normalizedSegments.map((segment) => ({
    html: segment.replace(/\n/g, '<br />'),
    isBlock: false
  }));
}

function buildDetailCards(detailCards, language) {
  if (!Array.isArray(detailCards)) {
    return [];
  }

  return detailCards
    .map((card) => {
      const title = normalizeText(getLocalizedContent(card?.title, language));
      const text = normalizeText(getLocalizedContent(card?.text, language));
      if (!title && !text) {
        return null;
      }
      return { title, text };
    })
    .filter(Boolean);
}

function parseLegacyTags(legacyTags) {
  if (!legacyTags) {
    return [];
  }

  if (Array.isArray(legacyTags)) {
    return legacyTags.map(normalizeText).filter(Boolean);
  }

  if (typeof legacyTags === 'string') {
    return legacyTags
      .split(LEGACY_TAG_SEPARATOR)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

export default function AboutContent({ initialContent }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language } = useLanguage();
  const { isAdmin } = useAdminStatus();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Scroll detection for fade effect with progressive opacity
  useEffect(() => {
    let rafId = null;
    const scrollStart = 20; // Start fading very early
    const scrollRange = 200; // Over what distance should it reach full opacity

    const handleScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const progress = Math.min(Math.max((scrollY - scrollStart) / scrollRange, 0), 1);

        // Update data attribute and CSS variable for smooth progressive fade
        const section = document.querySelector('.clean-about-page');
        if (section) {
          section.style.setProperty('--scroll-progress', progress.toString());
          const isScrolled = progress > 0.05; // 5% threshold
          if (isScrolled !== scrolled) {
            setScrolled(isScrolled);
          }
        }

        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [scrolled]);
  
  // Use dynamic data with fallbacks
  const {
    backgroundImage,
    title,
    subtitle,
    paragraphs,
    detailCards,
    tags
  } = useMemo(() => {
    const content = initialContent && typeof initialContent === 'object' ? initialContent : {};

    const backgroundImage = normalizeText(content.aboutBackgroundImage);
    const title =
      normalizeText(getLocalizedContent(content.aboutTitle, language)) ||
      normalizeText(getLocalizedContent(content.title, language)) ||
      FALLBACK_TITLE;
    const subtitle =
      normalizeText(getLocalizedContent(content.aboutSubtitle, language)) ||
      normalizeText(content.headline) ||
      FALLBACK_SUBTITLE;
    const overviewCopy = Array.isArray(content.overview)
      ? content.overview.map(normalizeText).filter(Boolean).join('\n\n')
      : '';
    const primaryContent =
      getLocalizedContent(content.aboutContent, language) ||
      content.lead ||
      content.summary ||
      overviewCopy ||
      '';
    const paragraphs = buildParagraphs(primaryContent);
    const detailCards = buildDetailCards(content.aboutDetailCards, language);
    const localizedTags = getLocalizedTags(content.aboutTags, language);
    const tags =
      Array.isArray(localizedTags) && localizedTags.length
        ? localizedTags
        : parseLegacyTags(content.tags);

    return {
      backgroundImage,
      title,
      subtitle,
      paragraphs,
      detailCards,
      tags: Array.isArray(tags) ? tags : []
    };
  }, [initialContent, language]);

  const editHref = '/administratorrrr/settings/channel/about';

  const canEdit = Boolean(isAdmin);
  const headerClassName = ['clean-about-page__header'];
  if (canEdit) {
    headerClassName.push('clean-about-page__header--editable');
  }

  const hasLead = paragraphs.length > 0;
  const hasCards = detailCards.length > 0;
  const hasTags = tags.length > 0;
  const hasContent = hasLead || hasCards || hasTags;

  return (
    <section
      className={`clean-about-page ${isLoaded ? 'is-loaded' : ''} ${backgroundImage ? 'has-background-image' : ''}`}
      data-scrolled={scrolled ? "true" : "false"}
    >
      {/* Scroll fade overlay - always present */}
      <div className="clean-about-page__scroll-overlay" aria-hidden="true" />

      {/* Optional background image */}
      <div className="clean-about-page__background">
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt=""
            className="clean-about-page__background-image"
            aria-hidden="true"
          />
        )}
        <div className="clean-about-page__gradient" />
      </div>
      
      <div className="clean-about-page__container">
        <header className={headerClassName.join(' ')}>
          <div className="clean-about-page__header-row">
            <div className="clean-about-page__heading">
              <h1 className="clean-about-page__title">{title}</h1>
              <p className="clean-about-page__subtitle">{subtitle}</p>
            </div>
            {canEdit ? (
              <Link href={editHref} className="clean-about-page__edit-btn">
                Edit About
              </Link>
            ) : null}
          </div>
        </header>
        
        <main className="clean-about-page__main">
          {hasLead ? (
            <div className="clean-about-page__text-content">
              <div className="clean-about-page__lead">
                {paragraphs.map(({ html, isBlock }, index) => {
                  const ParagraphElement = isBlock ? 'div' : 'p';
                  const className = isBlock
                    ? 'clean-about-page__lead-paragraph clean-about-page__lead-paragraph--block'
                    : 'clean-about-page__lead-paragraph';

                  return (
                    <ParagraphElement
                      key={index}
                      className={className}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}
          
          {hasCards ? (
            <div className="clean-about-page__cards">
              {detailCards.map((card, index) => (
                <article key={index} className="clean-about-page__card">
                  {card.title ? (
                    <h2 className="clean-about-page__card-title">{card.title}</h2>
                  ) : null}
                  {card.text ? (
                    <p className="clean-about-page__card-text">
                      {card.text}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
          
          {hasTags ? (
            <footer className="clean-about-page__footer">
              <div className="clean-about-page__tags">
                {tags.map((tag, index) => (
                  <span key={index} className="clean-about-page__tag">
                    {tag}
                  </span>
                ))}
              </div>
            </footer>
          ) : null}

          {!hasContent ? (
            <div className="clean-about-page__empty">{EMPTY_STATE_TEXT}</div>
          ) : null}
        </main>
      </div>
    </section>
  );
}
