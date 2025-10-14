'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';

const TRANSITION_MS = 500; // Smooth crossfade duration

export default function BrandWordmark({ className = '' }) {
  const { language } = useLanguage();
  const previousLanguageRef = useRef(language);
  const [leavingLanguage, setLeavingLanguage] = useState(null);
  const [enteringLanguage, setEnteringLanguage] = useState(null);

  
  // Simple transition effect
  useEffect(() => {
    const previousLanguage = previousLanguageRef.current;
    if (previousLanguage === language) {
      return;
    }

    // Set states for animation
    setLeavingLanguage(previousLanguage);
    setEnteringLanguage(language);
    previousLanguageRef.current = language;
    
    // Clear states after animation completes
    const timeout = setTimeout(() => {
      setLeavingLanguage(null);
      setEnteringLanguage(null);
    }, TRANSITION_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [language])

  const englishLabel = useMemo(() => t('brand.name', 'en'), []);
  const japaneseLabel = useMemo(() => t('brand.name', 'ja'), []);
  const activeLabel = t('brand.name', language);

  // Simple two-state logic: active or transitioning
  const isEnglishActive = language === 'en' && !enteringLanguage;
  const isJapaneseActive = language === 'ja' && !enteringLanguage;
  const isEnglishEntering = enteringLanguage === 'en';
  const isJapaneseEntering = enteringLanguage === 'ja';
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
        }${isEnglishEntering ? ' is-entering' : ''
        }${isEnglishLeaving ? ' is-leaving' : ''}`}
        aria-hidden="true"
      >
        {englishLabel}
      </span>
      <span
        className={`brand-wordmark__layer brand-wordmark__layer--ja${
          isJapaneseActive ? ' is-active' : ''
        }${isJapaneseEntering ? ' is-entering' : ''
        }${isJapaneseLeaving ? ' is-leaving' : ''}`}
        aria-hidden="true"
      >
        {japaneseLabel}
      </span>
    </span>
  );
}
