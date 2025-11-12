"use client";

import Link from "next/link";
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAdminStatus } from "../../lib/useAdminStatus";
import { getLocalizedContent } from "../../lib/translations";

const FALLBACK_TITLE = "About";
const FALLBACK_SUBTITLE = "Creative Technologist";
const FALLBACK_BODY = "About details are coming soon.";
const BLOCK_LEVEL_HTML_PATTERN =
  /<\/?(p|ul|ol|li|blockquote|h[1-6]|section|article|div|figure)[\s>]/i;
const PLACEHOLDER_PATTERN = /\{([^{}]+)\}/g;
const OPTIONS_DELIMITER = "⟡";
const PRIMARY_LEAD_TEXT = {
  en: `I’m a technologist who stitches playful tools and thoughtful stories together. I keep wandering through art, words, music, and comedy, and I reach for { new tools | old tricks | vintage gear | mischievous gadgets | words | code | musical instruments } to shape things that feel { useful | delightfully odd | generous | surprising | funny | beautiful | thought-provoking }`,
  ja: `僕は遊び心あるツールと物語を縫い合わせるテクノロジストです。アートや言葉、音楽、コメディを旅しながら、{ 新しい道具 | 古い工夫 | ヴィンテージの機材 | いたずらっぽいガジェット | 言葉 | コード | 楽器 } を手に取り、{ 役に立つ | ちょっと変 | やさしい | 驚きに満ちた | おかしい | 美しい | 考えたくなる } 体験を形にしています。`,
};
const PRIMARY_BODY_TEXT = {
  en: [
    `This site is my studio log—a place to gather experiments, stage performances, and the odd rabbit hole. I’m happiest when prototypes feel like invitations, so I’m documenting the process as much as the outcomes.`,
    `By trade I’m a product-minded technologist. I’m at ease with storytelling, fundraising, and translating between humans and machines. My typing may be clumsy, but I can coax an AI into shipping with me.`,
    `If any of these ideas spark something, reach out. Let’s build the kind of projects that you’d brag about to your past self`,
  ],
  ja: [
    `このサイトは僕のスタジオログです。実験や小さな公演、ふとした脱線をまとめる場所。プロトタイプが誰かへの招待状になる瞬間がいちばん好きなので、完成品だけでなく過程そのものも記録しています。`,
    `本業ではプロダクト志向のテクノロジストとして動いています。ストーリーテリングや資金調達、人と機械の通訳役は得意分野。タイピングはあやしいけれど、AIに寄り添って一緒に仕上げることはできます。`,
    `もしここにあるどれかが心に引っかかったら、ぜひ声をかけてください。過去の自分に自慢したくなるようなプロジェクトを、一緒につくりましょう。`,
  ],
};

function normalize(value) {
  return typeof value === "string" ? value.trim() : "";
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
    html: segment.replace(/\n/g, "<br />"),
    text: segment,
    isBlock: false,
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
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }

    const options = match[1]
      .split("|")
      .map((option) => option.trim())
      .filter(Boolean);

    if (options.length) {
      segments.push({
        type: "animated",
        options,
        signature: options.join(OPTIONS_DELIMITER),
      });
    } else {
      segments.push({
        type: "text",
        value: match[0],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      value: text.slice(lastIndex),
    });
  }

  return segments;
}

function renderTextSegment(text, key) {
  if (!text || !text.includes("\n")) {
    return <Fragment key={key}>{text}</Fragment>;
  }

  const lines = text.split("\n");
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
  const optionsCacheRef = useRef({ key: "", value: [] });
  const { sanitizedOptions, optionsSignature } = useMemo(() => {
    const rawOptions = Array.isArray(options) ? options : [];
    const trimmed = rawOptions
      .map((option) => option.trim())
      .filter((option) => option.length > 0);
    const normalized = trimmed.filter(
      (option, index) => trimmed.indexOf(option) === index
    );
    const cacheKey = signature || normalized.join(OPTIONS_DELIMITER);
    if (optionsCacheRef.current.key === cacheKey) {
      return {
        sanitizedOptions: optionsCacheRef.current.value,
        optionsSignature: cacheKey,
      };
    }
    const cachedValue = normalized.slice();
    optionsCacheRef.current = { key: cacheKey, value: cachedValue };
    return {
      sanitizedOptions: cachedValue,
      optionsSignature: cacheKey,
    };
  }, [options, signature]);

  const [currentIndex, setCurrentIndex] = useState(() =>
    sanitizedOptions.length ? 0 : -1
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const randomizedRef = useRef(false);
  const measurementRef = useRef(null);
  const [swapDimensions, setSwapDimensions] = useState({ width: 0, height: 0 });

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
  }, [optionsSignature, sanitizedOptions]);

  useEffect(() => {
    if (!isHydrated || sanitizedOptions.length < 2 || randomizedRef.current) {
      return;
    }
    randomizedRef.current = true;
    setCurrentIndex((previous) => {
      if (sanitizedOptions.length < 2) {
        return previous;
      }
      const pool = sanitizedOptions
        .map((_, index) => index)
        .filter((index) => index !== previous);
      const nextIndex = pool.length
        ? pool[Math.floor(Math.random() * pool.length)]
        : previous;
      return typeof nextIndex === "number" ? nextIndex : previous;
    });
  }, [isHydrated, optionsSignature, sanitizedOptions]);

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
        const pool = sanitizedOptions
          .map((_, index) => index)
          .filter((index) => index !== previous);
        const nextIndex = pool.length
          ? pool[Math.floor(Math.random() * pool.length)]
          : previous;
        return typeof nextIndex === "number" ? nextIndex : previous;
      });
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [currentIndex, isHydrated, optionsSignature, sanitizedOptions]);

  const current =
    currentIndex >= 0 && currentIndex < sanitizedOptions.length
      ? sanitizedOptions[currentIndex]
      : "";

  useEffect(() => {
    if (!current) {
      setIsPulsing(false);
      return;
    }
    setIsPulsing(true);
    const pulseTimeout = window.setTimeout(() => setIsPulsing(false), 520);
    return () => window.clearTimeout(pulseTimeout);
  }, [current]);

  const swapClasses = ["about-page__word-swap"];
  if (isPulsing) {
    swapClasses.push("about-page__word-swap--pulse");
  }

  const maxChars = useMemo(
    () =>
      sanitizedOptions.reduce((max, option) => Math.max(max, option.length), 0),
    [sanitizedOptions]
  );
  const minWidth = Math.max(maxChars, current.length, 4.5);

  useLayoutEffect(() => {
    if (!measurementRef.current) {
      setSwapDimensions({ width: 0, height: 0 });
      return;
    }

    const measureTargets = Array.from(
      measurementRef.current.querySelectorAll("[data-swap-measure-item]")
    );

    if (!measureTargets.length) {
      setSwapDimensions({ width: 0, height: 0 });
      return;
    }

    const measurements = measureTargets.map((element) =>
      element.getBoundingClientRect()
    );
    const nextWidth = Math.max(...measurements.map((entry) => entry.width));
    const nextHeight = Math.max(...measurements.map((entry) => entry.height));

    setSwapDimensions((previous) => {
      const widthDelta = Math.abs(previous.width - nextWidth);
      const heightDelta = Math.abs(previous.height - nextHeight);

      if (widthDelta > 0.5 || heightDelta > 0.5) {
        return {
          width: nextWidth,
          height: nextHeight,
        };
      }

      return previous;
    });
  }, [optionsSignature]);

  if (!current) {
    return null;
  }

  const swapStyle = minWidth ? { minWidth: `${minWidth}ch` } : {};
  if (swapDimensions.width) {
    swapStyle.width = `${swapDimensions.width}px`;
    swapStyle.minWidth = `${swapDimensions.width}px`;
  }
  if (swapDimensions.height) {
    swapStyle.height = `${swapDimensions.height}px`;
  }

  return (
    <Fragment>
      <span className={swapClasses.join(" ")} style={swapStyle}>
        <span key={current} className="about-page__word-swap-inner">
          {current}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="about-page__word-swap-measure"
        ref={measurementRef}
      >
        {sanitizedOptions.map((option, index) => (
          <span
            key={`${optionsSignature}-measure-${index}`}
            className="about-page__word-swap about-page__word-swap-measure-item"
            data-swap-measure-item
          >
            <span className="about-page__word-swap-inner">{option}</span>
          </span>
        ))}
      </span>
    </Fragment>
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
    const content =
      initialContent && typeof initialContent === "object"
        ? initialContent
        : {};
    const languageKey =
      typeof language === "string" && PRIMARY_LEAD_TEXT[language]
        ? language
        : "en";

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
      "";

    const overviewFallback = Array.isArray(content.overview)
      ? content.overview.map(normalize).filter(Boolean).join("\n\n")
      : "";

    const localizedBody =
      getLocalizedContent(content.aboutContent, language) ||
      getLocalizedContent(content.summary, language) ||
      overviewFallback ||
      "";

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
    const isLegacyLead = (paragraph) => {
      const text = paragraph?.text || paragraph?.html || "";
      return (
        /creative technologist guiding teams/i.test(text) ||
        /クリエイティブ[・･]?テクノロジスト/.test(text)
      );
    };

    const isLegacyBody = (paragraph) => {
      const text = paragraph?.text || paragraph?.html || "";
      return (
        /this dossier carries/i.test(text) ||
        /このドシエには/.test(text)
      );
    };

    const defaultLeadParagraphs = toParagraphs(
      PRIMARY_LEAD_TEXT[languageKey] || PRIMARY_LEAD_TEXT.en
    );
    if (!leadParagraphs.length || leadParagraphs.some(isLegacyLead)) {
      leadParagraphs = defaultLeadParagraphs;
    }

    const bodySource = PRIMARY_BODY_TEXT[languageKey] || PRIMARY_BODY_TEXT.en;
    const defaultBodyParagraphs = toParagraphs(bodySource.join("\n\n"));
    if (!bodyParagraphs.length || bodyParagraphs.some(isLegacyBody)) {
      bodyParagraphs = defaultBodyParagraphs;
    }

    return {
      title,
      subtitle,
      lead: leadParagraphs,
      body: bodyParagraphs,
    };
  }, [initialContent, language]);

  const editHref = "/administratorrrr/settings/channel/about";
  const hasLead = lead.length > 0;
  const hasBody = body.length > 0;

  const renderParagraph = (paragraph, baseClassName) => {
    const Element = paragraph.isBlock ? "div" : "p";
    const className = paragraph.isBlock
      ? `${baseClassName} ${baseClassName}--block`
      : baseClassName;

    if (paragraph.isBlock) {
      return (
        <Element
          key={`${baseClassName}-${paragraph.id}`}
          className={className}
          dangerouslySetInnerHTML={{ __html: paragraph.html }}
        />
      );
    }

    const segments = splitSegmentsWithAnimatedWords(
      paragraph.text || paragraph.html || ""
    );
    const content =
      segments.length > 0
        ? segments.map((segment, index) =>
            segment.type === "animated" ? (
              <AnimatedWordSwap
                key={`${baseClassName}-${paragraph.id}-swap-${index}`}
                options={segment.options}
                signature={segment.signature}
              />
            ) : (
              renderTextSegment(
                segment.value,
                `${baseClassName}-${paragraph.id}-text-${index}`
              )
            )
          )
        : renderTextSegment(
            paragraph.text || paragraph.html || "",
            `${baseClassName}-${paragraph.id}-text`
          );

    return (
      <Element key={`${baseClassName}-${paragraph.id}`} className={className}>
        {content}
      </Element>
    );
  };

  return (
    <section className={`about-page ${isReady ? "is-ready" : ""}`}>
      <div className="about-page__inner">
        <header
          className={`about-page__header${
            isAdmin ? " about-page__header--editable" : ""
          }`}
        >
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
            <div
              className="about-page__copy about-page__lead"
              aria-label="Lead description"
            >
              {lead.map((paragraph) =>
                renderParagraph(paragraph, "about-page__lead-paragraph")
              )}
            </div>
          ) : null}

          {hasBody ? (
            <article
              className="about-page__copy about-page__body"
              aria-label="About body copy"
            >
              {body.map((paragraph) =>
                renderParagraph(paragraph, "about-page__body-paragraph")
              )}
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}
