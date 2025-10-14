'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';

const TRANSITION_MS = 600; // Longer for seamless crossfade

export default function BrandWordmark({ className = '' }) {
  const { language } = useLanguage();
  const previousLanguageRef = useRef(language);
  const [leavingLanguage, setLeavingLanguage] = useState(null);

  useEffect(() => {
    const previousLanguage = previousLanguageRef.current;
    if (previousLanguage === language) {
      return;
    }

    setLeavingLanguage(previousLanguage);
    previousLanguageRef.current = language;

    const timeoutId = window.setTimeout(() => {
      setLeavingLanguage(null);
    }, TRANSITION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [language]);

  const englishLabel = useMemo(() => t('brand.name', 'en'), []);
  const japaneseLabel = useMemo(() => t('brand.name', 'ja'), []);
  const activeLabel = t('brand.name', language);

  const isEnglishActive = language === 'en';
  const isJapaneseActive = language === 'ja';
  const isEnglishLeaving = leavingLanguage === 'en';
  const isJapaneseLeaving = leavingLanguage === 'ja';

  return (
    <span
      className={`brand-wordmark${className ? ` ${className}` : ''}`}
      aria-label={activeLabel}
      data-language={language}
    >
      <span
        className={`brand-wordmark__layer brand-wordmark__layer--en${
          isEnglishActive ? ' is-active' : ''
        }${isEnglishLeaving ? ' is-leaving' : ''}`}
        aria-hidden="true"
      >
        {englishLabel}
      </span>
      <span
        className={`brand-wordmark__layer brand-wordmark__layer--ja${
          isJapaneseActive ? ' is-active' : ''
        }${isJapaneseLeaving ? ' is-leaving' : ''}`}
        aria-hidden="true"
      >
        {japaneseLabel}
      </span>
    </span>
  );
}
