'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';

const TRANSITION_MS = 600; // Longer for seamless crossfade
const DEBUG = false; // Disable debug logging after fix

export default function BrandWordmark({ className = '' }) {
  const { language } = useLanguage();
  const previousLanguageRef = useRef(language);
  const [leavingLanguage, setLeavingLanguage] = useState(null);
  const [enteringLanguage, setEnteringLanguage] = useState(null);
  const renderCountRef = useRef(0);
  const enLayerRef = useRef(null);
  const jaLayerRef = useRef(null);
  const componentId = useRef(`bw-${Date.now()}`);
  const mountTimeRef = useRef(Date.now());
  
  // Track component mount/unmount
  useEffect(() => {
    const id = componentId.current;
    const mountTime = mountTimeRef.current;
    
    if (DEBUG) {
      console.log('🎬 BrandWordmark MOUNTED', {
        id: id,
        mountTime: mountTime,
        initialLanguage: language
      });
    }
    
    return () => {
      if (DEBUG) {
        console.log('💥 BrandWordmark UNMOUNTED', {
          id: id,
          lifetime: Date.now() - mountTime
        });
      }
    };
  }, [language]); // Include language dependency

  // Log initial computed styles when refs are attached
  useEffect(() => {
    if (!DEBUG) return;
    
    // Use RAF to ensure styles are computed after render
    requestAnimationFrame(() => {
      if (enLayerRef.current) {
        const styles = window.getComputedStyle(enLayerRef.current);
        console.log('🏁 EN Layer Initial Styles:', {
          opacity: styles.opacity,
          transform: styles.transform,
          classes: enLayerRef.current.className
        });
      }
      if (jaLayerRef.current) {
        const styles = window.getComputedStyle(jaLayerRef.current);
        console.log('🏁 JA Layer Initial Styles:', {
          opacity: styles.opacity,
          transform: styles.transform,
          classes: jaLayerRef.current.className
        });
      }
    });
  }, [language, enteringLanguage, leavingLanguage]); // Check initial styles on state changes
  
  // Monitor CSS computed styles with high precision
  useEffect(() => {
    if (!DEBUG || !enLayerRef.current || !jaLayerRef.current) return;
    
    const checkStyles = () => {
      const enStyles = window.getComputedStyle(enLayerRef.current);
      const jaStyles = window.getComputedStyle(jaLayerRef.current);
      
      // Check if DOM nodes are the same
      const enNode = enLayerRef.current;
      const jaNode = jaLayerRef.current;
      
      console.log('🎨 Style snapshot:', {
        timestamp: Date.now(),
        componentId: componentId.current,
        en: {
          opacity: enStyles.opacity,
          transform: enStyles.transform,
          filter: enStyles.filter,
          transition: enStyles.transition.substring(0, 100), // Truncate for readability
          classes: enNode.className,
          nodeId: enNode.dataset.nodeId || 'none',
          isConnected: enNode.isConnected
        },
        ja: {
          opacity: jaStyles.opacity,
          transform: jaStyles.transform,
          filter: jaStyles.filter,
          transition: jaStyles.transition.substring(0, 100),
          classes: jaNode.className,
          nodeId: jaNode.dataset.nodeId || 'none',
          isConnected: jaNode.isConnected
        }
      });
      
      // Detect snap conditions
      const enOp = parseFloat(enStyles.opacity);
      const jaOp = parseFloat(jaStyles.opacity);
      
      if (enOp === 0 && jaOp === 0) {
        console.error('🚨 SNAP DETECTED: Both layers at opacity 0!');
      }
      if (enOp === 1 && jaOp === 1) {
        console.error('🚨 SNAP DETECTED: Both layers at opacity 1!');
      }
      if (Math.abs(enOp - jaOp) > 0.9) {
        console.warn('⚠️ Large opacity gap:', { en: enOp, ja: jaOp, gap: Math.abs(enOp - jaOp) });
      }
    };
    
    // Initial check
    console.log('📸 Starting style monitoring for transition');
    checkStyles();
    
    // Check frequently during transition
    const interval = setInterval(checkStyles, 25);
    
    // Stop after transition
    const stopTimeout = setTimeout(() => {
      clearInterval(interval);
      console.log('📸 Stopped style monitoring');
    }, TRANSITION_MS + 200);
    
    return () => {
      clearInterval(interval);
      clearTimeout(stopTimeout);
    };
  }, [language, leavingLanguage, enteringLanguage]); // Re-run when states change

  // Force proper transition initialization with useLayoutEffect
  useLayoutEffect(() => {
    const previousLanguage = previousLanguageRef.current;
    if (previousLanguage === language) {
      return;
    }

    if (DEBUG) {
      console.log('🔄 BrandWordmark: Language changing', {
        from: previousLanguage,
        to: language,
        timestamp: Date.now(),
        currentStates: {
          leaving: leavingLanguage,
          entering: enteringLanguage
        }
      });
    }

    // Set leaving state for old language
    setLeavingLanguage(previousLanguage);
    setEnteringLanguage(language);
    previousLanguageRef.current = language;
    
    // Use requestAnimationFrame to ensure DOM is ready with base styles
    // before adding active classes - this prevents the snap
    const rafId = requestAnimationFrame(() => {
      // Small delay to activate entering language
      const activateTimeout = window.setTimeout(() => {
        if (DEBUG) {
          console.log('📍 Making entering language active', {
            timestamp: Date.now(),
            wasEntering: language
          });
        }
        setEnteringLanguage(null); // Now it becomes fully active
      }, 50); // Short overlap for smooth crossfade

      // Clear leaving language after transition completes
      const clearTimeout = window.setTimeout(() => {
        if (DEBUG) {
          console.log('📍 Clearing leaving state', {
            wasLeaving: previousLanguage,
            timestamp: Date.now()
          });
        }
        setLeavingLanguage(null);
      }, TRANSITION_MS);

      // Store timeouts for cleanup
      return () => {
        window.clearTimeout(activateTimeout);
        window.clearTimeout(clearTimeout);
      };
    });

    return () => {
      cancelAnimationFrame(rafId);
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

  // Debug render with class computation
  renderCountRef.current++;
  if (DEBUG) {
    const enClasses = `brand-wordmark__layer brand-wordmark__layer--en${
      isEnglishActive ? ' is-active' : ''
    }${isEnglishEntering ? ' is-entering' : ''
    }${isEnglishLeaving ? ' is-leaving' : ''}`;
    
    const jaClasses = `brand-wordmark__layer brand-wordmark__layer--ja${
      isJapaneseActive ? ' is-active' : ''
    }${isJapaneseEntering ? ' is-entering' : ''
    }${isJapaneseLeaving ? ' is-leaving' : ''}`;
    
    console.log('🎨 RENDER', {
      renderCount: renderCountRef.current,
      timestamp: Date.now(),
      states: {
        language,
        leavingLanguage,
        enteringLanguage
      },
      computed: {
        isEnglishActive,
        isEnglishEntering,
        isEnglishLeaving,
        isJapaneseActive,
        isJapaneseEntering,
        isJapaneseLeaving
      },
      resultingClasses: {
        en: enClasses,
        ja: jaClasses
      }
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
      >
        {japaneseLabel}
      </span>
    </span>
  );
}
