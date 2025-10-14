'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';

const TRANSITION_MS = 600; // Longer for seamless crossfade
const DEBUG = false; // Disable debug logging for production

export default function BrandWordmark({ className = '' }) {
  const { language } = useLanguage();
  const previousLanguageRef = useRef(language);
  const [leavingLanguage, setLeavingLanguage] = useState(null);
  const [enteringLanguage, setEnteringLanguage] = useState(null);
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

    // Start the staged transition
    setLeavingLanguage(previousLanguage);
    setEnteringLanguage(language);
    previousLanguageRef.current = language;
    
    // Small delay before making new language fully active
    const activateTimeout = window.setTimeout(() => {
      setEnteringLanguage(null); // Now it becomes fully active
    }, 80); // Small overlap period

    // Clear leaving language after transition completes
    const clearTimeout = window.setTimeout(() => {
      if (DEBUG) {
        console.log('⏰ BrandWordmark: Clearing leaving language', {
          wasLeaving: previousLanguage,
          timestamp: Date.now()
        });
      }
      setLeavingLanguage(null);
    }, TRANSITION_MS);

    return () => {
      window.clearTimeout(activateTimeout);
      window.clearTimeout(clearTimeout);
    };
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  const englishLabel = useMemo(() => t('brand.name', 'en'), []);
  const japaneseLabel = useMemo(() => t('brand.name', 'ja'), []);
  const activeLabel = t('brand.name', language);

  // Three-state transition: leaving -> entering -> active
  const isEnglishActive = language === 'en' && enteringLanguage !== 'en';
  const isJapaneseActive = language === 'ja' && enteringLanguage !== 'ja';
  const isEnglishEntering = enteringLanguage === 'en';
  const isJapaneseEntering = enteringLanguage === 'ja';
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
        }${isEnglishEntering ? ' is-entering' : ''
        }${isEnglishLeaving ? ' is-leaving' : ''}`}
        aria-hidden="true"
        data-debug-state={`active:${isEnglishActive} entering:${isEnglishEntering} leaving:${isEnglishLeaving}`}
        style={DEBUG ? { border: isEnglishActive ? '1px solid green' : isEnglishEntering ? '1px solid yellow' : isEnglishLeaving ? '1px solid red' : 'none' } : undefined}
      >
        {englishLabel}
      </span>
      <span
        ref={jaLayerRef}
        className={`brand-wordmark__layer brand-wordmark__layer--ja${
          isJapaneseActive ? ' is-active' : ''
        }${isJapaneseEntering ? ' is-entering' : ''
        }${isJapaneseLeaving ? ' is-leaving' : ''}`}
        aria-hidden="true"
        data-debug-state={`active:${isJapaneseActive} entering:${isJapaneseEntering} leaving:${isJapaneseLeaving}`}
        style={DEBUG ? { border: isJapaneseActive ? '1px solid green' : isJapaneseEntering ? '1px solid yellow' : isJapaneseLeaving ? '1px solid red' : 'none' } : undefined}
      >
        {japaneseLabel}
      </span>
    </span>
  );
}
