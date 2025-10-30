
'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAdminStatus } from '../../lib/useAdminStatus';
import { getLocalizedContent } from '../../lib/translations';

const FALLBACK_TITLE = 'About';
const FALLBACK_SUBTITLE = 'Creative Technologist';
const FALLBACK_BODY = 'About details are coming soon.';
const BLOCK_LEVEL_HTML_PATTERN = /<\/?(p|ul|ol|li|blockquote|h[1-6]|section|article|div|figure)[\s>]/i;
const PLACEHOLDER_PATTERN = /\{([^{}]+)\}/g;
const OPTIONS_DELIMITER = '⟡';
const PRIMARY_LEAD_TEXT = `I am a technologist who loves making things. Generally software, but I also love exploring art, words, music and comedy. I love to use { new tools | old tools | vintage tools | weird tools | words | code | musical instruments } to make things that are { useful | stupid | interesting | surprising | funny | beautiful | thought-provoking }.`;
const PRIMARY_BODY_TEXT = [
  `I am building this site to showcase some creations, and to find friends and co-collaborators. I have far (farrr) too many ideas and not enough time, and it'd be nice to hack on some ideas together. My goal is to build with people who I'd want to spend time with anyway.`,
  `I'm good on the product side. I'm great at public speaking, fundraising and communicating. I'm pretty bad at coding, but I'm good at talking to an AI until I get what I want.`,
  `If any of my ideas are interesting to you and you'd like to collaborate, find a way to contact me and let's see if we click.`
];

function normalize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toParagraphs(raw) {
  const source = normalize(raw);
  if (!source) {
    return [];
  }

  if (BLOCK_LEVEL_HTML_PATTERN.test(source)) {
    return [{ id: 0, html: source, text: source, isBlock: true }];
  }

  const segments = source
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const safeSegments = segments.length ? segments : [source];

  return safeSegments.map((segment, index) => ({
    id: index,
    html: segment.replace(/\n/g, '<br />'),
    text: segment,
    isBlock: false
  }));
}

function splitSegmentsWithAnimatedWords(text) {
  if (!text) {
    return [];
  }

  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = PLACEHOLDER_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: text.slice(lastIndex, match.index)
      });
    }

    const options = match[1]
      .split('|')
      .map((option) => option.trim())
      .filter(Boolean);

    if (options.length) {
      segments.push({
        type: 'animated',
        options,
        signature: options.join(OPTIONS_DELIMITER)
      });
    } else {
      segments.push({
        type: 'text',
        value: match[0]
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      value: text.slice(lastIndex)
    });
  }

  return segments;
}

function renderTextSegment(text, key) {
  if (!text || !text.includes('\n')) {
    return <Fragment key={key}>{text}</Fragment>;
  }

  const lines = text.split('\n');
  return (
    <Fragment key={key}>
      {lines.map((line, index) => (
        <Fragment key={`${key}-line-${index}`}>
          {index > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </Fragment>
  );
}

function AnimatedWordSwap({ options, signature }) {
  const optionsCacheRef = useRef({ key: '', value: [] });
  const { sanitizedOptions, optionsSignature } = useMemo(() => {
    const rawOptions = Array.isArray(options) ? options : [];
    const trimmed = rawOptions
      .map((option) => option.trim())
      .filter((option) => option.length > 0);
    const normalized = trimmed.filter((option, index) => trimmed.indexOf(option) === index);
    const cacheKey = signature || normalized.join(OPTIONS_DELIMITER);
    if (optionsCacheRef.current.key === cacheKey) {
      return {
        sanitizedOptions: optionsCacheRef.current.value,
        optionsSignature: cacheKey
      };
    }
    const cachedValue = normalized.slice();
    optionsCacheRef.current = { key: cacheKey, value: cachedValue };
    return {
      sanitizedOptions: cachedValue,
      optionsSignature: cacheKey
    };
  }, [options, signature]);

  const [currentIndex, setCurrentIndex] = useState(() => (sanitizedOptions.length ? 0 : -1));
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const randomizedRef = useRef(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!sanitizedOptions.length) {
      randomizedRef.current = false;
      setCurrentIndex(-1);
      return;
    }

    setCurrentIndex((previous) => {
      if (previous < 0 || previous >= sanitizedOptions.length) {
        return 0;
      }
      return previous;
    });
    randomizedRef.current = false;
  }, [optionsSignature, sanitizedOptions.length]);

  useEffect(() => {
    if (!isHydrated || sanitizedOptions.length < 2 || randomizedRef.current) {
      return;
    }
    randomizedRef.current = true;
    setCurrentIndex((previous) => {
      if (sanitizedOptions.length < 2) {
        return previous;
      }
      const pool = sanitizedOptions.map((_, index) => index).filter((index) => index !== previous);
      const nextIndex = pool.length ? pool[Math.floor(Math.random() * pool.length)] : previous;
      return typeof nextIndex === 'number' ? nextIndex : previous;
    });
  }, [isHydrated, optionsSignature, sanitizedOptions.length]);

  useEffect(() => {
    if (!isHydrated || sanitizedOptions.length < 2) {
      return undefined;
    }

    const delay = 1400 + Math.random() * 2000;
    const timeoutId = window.setTimeout(() => {
      setCurrentIndex((previous) => {
        if (sanitizedOptions.length < 2) {
          return previous;
        }
        const pool = sanitizedOptions.map((_, index) => index).filter((index) => index !== previous);
        const nextIndex = pool.length ? pool[Math.floor(Math.random() * pool.length)] : previous;
        return typeof nextIndex === 'number' ? nextIndex : previous;
      });
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [currentIndex, isHydrated, optionsSignature, sanitizedOptions.length]);

  const current =
    currentIndex >= 0 && currentIndex < sanitizedOptions.length ? sanitizedOptions[currentIndex] : '';

  useEffect(() => {
    if (!current) {
      setIsPulsing(false);
      return;
    }
    setIsPulsing(true);
    const pulseTimeout = window.setTimeout(() => setIsPulsing(false), 520);
    return () => window.clearTimeout(pulseTimeout);
  }, [current]);

  if (!current) {
    return null;
  }

  const swapClasses = ['about-page__word-swap'];
  if (isPulsing) {
    swapClasses.push('about-page__word-swap--pulse');
  }

  const maxChars = useMemo(
    () => sanitizedOptions.reduce((max, option) => Math.max(max, option.length), 0),
    [sanitizedOptions, optionsSignature]
  );
  const minWidth = Math.max(maxChars, current.length, 4.5);

  return (
    <span className={swapClasses.join(' ')} style={minWidth ? { minWidth: `${minWidth}ch` } : undefined}>
      <span key={current} className="about-page__word-swap-inner">
        {current}
      </span>
    </span>
  );
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

    // Override with the requested primary copy if legacy text is present or content is missing.
    const defaultLeadParagraphs = toParagraphs(PRIMARY_LEAD_TEXT);
    if (
      !leadParagraphs.length ||
      leadParagraphs.some((paragraph) =>
        /creative technologist guiding teams/i.test(paragraph?.text || '')
      )
    ) {
      leadParagraphs = defaultLeadParagraphs;
    }

    const defaultBodyParagraphs = toParagraphs(PRIMARY_BODY_TEXT.join('\n\n'));
    if (
      !bodyParagraphs.length ||
      bodyParagraphs.some((paragraph) =>
        /this dossier carries/i.test(paragraph?.text || '')
      )
    ) {
      bodyParagraphs = defaultBodyParagraphs;
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

  const renderParagraph = (paragraph, baseClassName) => {
    const Element = paragraph.isBlock ? 'div' : 'p';
    const className = paragraph.isBlock ? `${baseClassName} ${baseClassName}--block` : baseClassName;

    if (paragraph.isBlock) {
      return (
        <Element
          key={`${baseClassName}-${paragraph.id}`}
          className={className}
          dangerouslySetInnerHTML={{ __html: paragraph.html }}
        />
      );
    }

    const segments = splitSegmentsWithAnimatedWords(paragraph.text || paragraph.html || '');
    const content =
      segments.length > 0
        ? segments.map((segment, index) =>
            segment.type === 'animated' ? (
              <AnimatedWordSwap
                key={`${baseClassName}-${paragraph.id}-swap-${index}`}
                options={segment.options}
                signature={segment.signature}
              />
            ) : (
              renderTextSegment(segment.value, `${baseClassName}-${paragraph.id}-text-${index}`)
            )
          )
        : renderTextSegment(paragraph.text || paragraph.html || '', `${baseClassName}-${paragraph.id}-text`);

    return (
      <Element key={`${baseClassName}-${paragraph.id}`} className={className}>
        {content}
      </Element>
    );
  };

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
              {lead.map((paragraph) => renderParagraph(paragraph, 'about-page__lead-paragraph'))}
            </div>
          ) : null}

          {hasBody ? (
            <article className="about-page__body" aria-label="About body copy">
              {body.map((paragraph) => renderParagraph(paragraph, 'about-page__body-paragraph'))}
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}
