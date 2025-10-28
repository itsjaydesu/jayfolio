
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAdminStatus } from '../../lib/useAdminStatus';
import { getLocalizedContent } from '../../lib/translations';

const FALLBACK_TITLE = 'About';
const FALLBACK_SUBTITLE = 'Creative Technologist';
const FALLBACK_BODY = 'About details are coming soon.';
const BLOCK_LEVEL_HTML_PATTERN = /<\/?(p|ul|ol|li|blockquote|h[1-6]|section|article|div|figure)[\s>]/i;

function normalize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toParagraphs(raw) {
  const source = normalize(raw);
  if (!source) {
    return [];
  }

  if (BLOCK_LEVEL_HTML_PATTERN.test(source)) {
    return [{ id: 0, html: source, isBlock: true }];
  }

  const segments = source
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const safeSegments = segments.length ? segments : [source];

  return safeSegments.map((segment, index) => ({
    id: index,
    html: segment.replace(/\n/g, '<br />'),
    isBlock: false
  }));
}

export default function AboutContent({ initialContent }) {
  const { language } = useLanguage();
  const { isAdmin } = useAdminStatus();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const { title, subtitle, lead, body } = useMemo(() => {
    const content = initialContent && typeof initialContent === 'object' ? initialContent : {};

    const title =
      normalize(getLocalizedContent(content.aboutTitle, language)) ||
      normalize(getLocalizedContent(content.title, language)) ||
      FALLBACK_TITLE;

    const subtitle =
      normalize(getLocalizedContent(content.aboutSubtitle, language)) ||
      normalize(content.headline) ||
      FALLBACK_SUBTITLE;

    const localizedLead =
      getLocalizedContent(content.aboutLead, language) ||
      getLocalizedContent(content.lead, language) ||
      content.lead ||
      '';

    const overviewFallback = Array.isArray(content.overview)
      ? content.overview.map(normalize).filter(Boolean).join('\n\n')
      : '';

    const localizedBody =
      getLocalizedContent(content.aboutContent, language) ||
      getLocalizedContent(content.summary, language) ||
      overviewFallback ||
      '';

    let leadParagraphs = toParagraphs(localizedLead);
    let bodyParagraphs = toParagraphs(localizedBody);

    if (!leadParagraphs.length && bodyParagraphs.length) {
      leadParagraphs = [bodyParagraphs[0]];
      bodyParagraphs = bodyParagraphs.slice(1);
    }

    if (!bodyParagraphs.length) {
      bodyParagraphs = toParagraphs(FALLBACK_BODY);
    }

    return {
      title,
      subtitle,
      lead: leadParagraphs,
      body: bodyParagraphs
    };
  }, [initialContent, language]);

  const editHref = '/administratorrrr/settings/channel/about';
  const hasLead = lead.length > 0;
  const hasBody = body.length > 0;

  return (
    <section className={`about-page ${isReady ? 'is-ready' : ''}`}>
      <div className="about-page__inner">
        <header className={`about-page__header${isAdmin ? ' about-page__header--editable' : ''}`}>
          <div className="about-page__title-group">
            <h1 className="about-page__title">{title}</h1>
            <p className="about-page__subtitle">{subtitle}</p>
          </div>
          {isAdmin ? (
            <Link href={editHref} className="about-page__edit-link">
              Edit About
            </Link>
          ) : null}
        </header>

        <div className="about-page__content">
          {hasLead ? (
            <div className="about-page__lead" aria-label="Lead description">
              {lead.map(({ id, html, isBlock }) => {
                const Element = isBlock ? 'div' : 'p';
                return (
                  <Element
                    key={`lead-${id}`}
                    className={`about-page__lead-paragraph${isBlock ? ' about-page__lead-paragraph--block' : ''}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              })}
            </div>
          ) : null}

          {hasBody ? (
            <article className="about-page__body" aria-label="About body copy">
              {body.map(({ id, html, isBlock }) => {
                const Element = isBlock ? 'div' : 'p';
                return (
                  <Element
                    key={`body-${id}`}
                    className={`about-page__body-paragraph${isBlock ? ' about-page__body-paragraph--block' : ''}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              })}
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}
