'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';

const TRANSITION_MS = 600; // Longer for seamless crossfade
const DEBUG = true; // Enable debug logging

export default function BrandWordmark({ className = '' }) {
  const { language } = useLanguage();
  const previousLanguageRef = useRef(language);
  const [leavingLanguage, setLeavingLanguage] = useState(null);
  const renderCountRef = useRef(0);
  const enLayerRef = useRef(null);
  const jaLayerRef = useRef(null);

  // Monitor opacity values
  useEffect(() => {
    if (!DEBUG || !enLayerRef.current || !jaLayerRef.current) return;
    
    const checkOpacity = () => {
      const enOpacity = window.getComputedStyle(enLayerRef.current).opacity;
      const jaOpacity = window.getComputedStyle(jaLayerRef.current).opacity;
      
      console.log('👁️ Opacity check:', {
        en: enOpacity,
        ja: jaOpacity,
        enClasses: enLayerRef.current.className,
        jaClasses: jaLayerRef.current.className,
        timestamp: Date.now()
      });
      
      // Detect potential snap conditions
      if (enOpacity === '0' && jaOpacity === '0') {
        console.warn('⚠️ BOTH LAYERS AT OPACITY 0!');
      }
      if (enOpacity === '1' && jaOpacity === '1') {
        console.warn('⚠️ BOTH LAYERS AT OPACITY 1!');
      }
    };
    
    // Check every 50ms during transition
    const interval = setInterval(checkOpacity, 50);
    checkOpacity(); // Initial check
    
    // Stop checking after transition time + buffer
    setTimeout(() => clearInterval(interval), TRANSITION_MS + 200);
    
    return () => clearInterval(interval);
  }, [language, leavingLanguage]);

  useEffect(() => {
    const previousLanguage = previousLanguageRef.current;
    if (previousLanguage === language) {
      return;
    }

    if (DEBUG) {
      console.log('🔄 BrandWordmark: Language changing', {
        from: previousLanguage,
        to: language,
        timestamp: Date.now(),
        currentLeavingLanguage: leavingLanguage
      });
    }

    setLeavingLanguage(previousLanguage);
    previousLanguageRef.current = language;

    const timeoutId = window.setTimeout(() => {
      if (DEBUG) {
        console.log('⏰ BrandWordmark: Clearing leaving language', {
          wasLeaving: previousLanguage,
          timestamp: Date.now()
        });
      }
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

  // Debug render
  renderCountRef.current++;
  if (DEBUG) {
    console.log('🎨 BrandWordmark: Render', {
      renderCount: renderCountRef.current,
      language,
      leavingLanguage,
      isEnglishActive,
      isJapaneseActive,
      isEnglishLeaving,
      isJapaneseLeaving,
      timestamp: Date.now()
    });
  }

  return (
    <span
      className={`brand-wordmark${className ? ` ${className}` : ''}`}
      aria-label={activeLabel}
      data-language={language}
    >
      <span
        ref={enLayerRef}
        className={`brand-wordmark__layer brand-wordmark__layer--en${
          isEnglishActive ? ' is-active' : ''
        }${isEnglishLeaving ? ' is-leaving' : ''}`}
        aria-hidden="true"
        data-debug-state={`active:${isEnglishActive} leaving:${isEnglishLeaving}`}
        style={DEBUG ? { border: isEnglishActive ? '1px solid green' : isEnglishLeaving ? '1px solid red' : 'none' } : undefined}
      >
        {englishLabel}
      </span>
      <span
        ref={jaLayerRef}
        className={`brand-wordmark__layer brand-wordmark__layer--ja${
          isJapaneseActive ? ' is-active' : ''
        }${isJapaneseLeaving ? ' is-leaving' : ''}`}
        aria-hidden="true"
        data-debug-state={`active:${isJapaneseActive} leaving:${isJapaneseLeaving}`}
        style={DEBUG ? { border: isJapaneseActive ? '1px solid green' : isJapaneseLeaving ? '1px solid red' : 'none' } : undefined}
      >
        {japaneseLabel}
      </span>
    </span>
  );
}
