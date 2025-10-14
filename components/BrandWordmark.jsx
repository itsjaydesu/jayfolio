'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';

// Animation configuration
const TRANSITION_DURATION_MS = 600; // Smooth transition duration
const TRANSITION_EASING = 'cubic-bezier(0.4, 0.0, 0.2, 1)'; // Smooth easing
const DEBUG = true; // Enable debug logging to verify fix

export default function BrandWordmark({ className = '' }) {
  const { language } = useLanguage();
  const englishLabel = useMemo(() => t('brand.name', 'en'), []);
  const japaneseLabel = useMemo(() => t('brand.name', 'ja'), []);
  const activeLabel = t('brand.name', language);
  
  // Debug tracking
  const componentId = useRef(`bw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const renderCount = useRef(0);
  const previousLanguageRef = useRef(language);
  
  // Refs for DOM elements - needed for forcing reflow
  const enLayerRef = useRef(null);
  const jaLayerRef = useRef(null);
  
  // Track if component is mounted to prevent state updates on unmount
  const isMountedRef = useRef(true);
  
  // State for animation - tracks opacity and transform values
  const [enState, setEnState] = useState({
    opacity: language === 'en' ? 1 : 0,
    transform: language === 'en' ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(0, 4%, 0) scale(0.98)',
    filter: language === 'en' ? 'blur(0) saturate(1)' : 'blur(0.8px) saturate(1.05)',
    zIndex: language === 'en' ? 2 : 1
  });
  
  const [jaState, setJaState] = useState({
    opacity: language === 'ja' ? 1 : 0,
    transform: language === 'ja' ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(0, 4%, 0) scale(0.98)',
    filter: language === 'ja' ? 'blur(0) saturate(1)' : 'blur(0.8px) saturate(1.05)',
    zIndex: language === 'ja' ? 2 : 1
  });
  
  // Track if we should apply transitions (not on first render)
  const [shouldTransition, setShouldTransition] = useState(false);
  
  // Debug: Log every render
  renderCount.current++;
  if (DEBUG) {
    console.log(`🎨 [${componentId.current}] RENDER #${renderCount.current}`, {
      language,
      previousLanguage: previousLanguageRef.current,
      shouldTransition,
      enState: { opacity: enState.opacity, zIndex: enState.zIndex },
      jaState: { opacity: jaState.opacity, zIndex: jaState.zIndex },
      timestamp: Date.now()
    });
  }
  
  // Handle cleanup on unmount AND enable transitions after mount
  useEffect(() => {
    const id = componentId.current;
    if (DEBUG) {
      console.log(`🚀 [${id}] MOUNTED`, {
        language,
        timestamp: Date.now()
      });
    }
    
    // Enable transitions after a small delay to avoid initial animation
    // This ensures transitions are ready BEFORE any language changes
    const enableTransitionsTimeout = setTimeout(() => {
      if (DEBUG) {
        console.log(`✅ [${id}] Enabling transitions after mount`);
      }
      setShouldTransition(true);
    }, 50); // Small delay to ensure no initial animation
    
    return () => {
      clearTimeout(enableTransitionsTimeout);
      isMountedRef.current = false;
      if (DEBUG) {
        console.log(`💥 [${id}] UNMOUNTED`, {
          timestamp: Date.now()
        });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Use useLayoutEffect to update styles before browser paint
  useLayoutEffect(() => {
    const languageChanged = previousLanguageRef.current !== language;
    
    if (DEBUG) {
      console.log(`⚡ [${componentId.current}] useLayoutEffect fired`, {
        shouldTransition,
        languageChanged,
        previousLanguage: previousLanguageRef.current,
        currentLanguage: language,
        timestamp: Date.now()
      });
    }
    
    // Check if language actually changed
    if (!languageChanged) {
      if (DEBUG) {
        console.log(`🔄 [${componentId.current}] No language change, skipping update`);
      }
      return;
    }
    
    // Skip if this is the initial render (before transitions are enabled)
    // This prevents the initial state from animating
    if (!shouldTransition && previousLanguageRef.current === language) {
      if (DEBUG) {
        console.log(`⏭️ [${componentId.current}] Skipping initial render`);
      }
      previousLanguageRef.current = language;
      return;
    }
    
    if (DEBUG) {
      console.log(`🎬 [${componentId.current}] Starting transition`, {
        from: previousLanguageRef.current,
        to: language,
        shouldTransition,
        transitionsEnabled: shouldTransition ? 'YES ✅' : 'NO ❌'
      });
      
      // Log current computed styles BEFORE changes
      if (enLayerRef.current && jaLayerRef.current) {
        const enStyles = window.getComputedStyle(enLayerRef.current);
        const jaStyles = window.getComputedStyle(jaLayerRef.current);
        console.log(`📊 [${componentId.current}] Computed styles BEFORE:`, {
          en: {
            opacity: enStyles.opacity,
            transform: enStyles.transform,
            transition: enStyles.transition
          },
          ja: {
            opacity: jaStyles.opacity,
            transform: jaStyles.transform,
            transition: jaStyles.transition
          },
          transitionsEnabled: shouldTransition ? 'YES ✅' : 'NO ❌'
        });
        
        // Critical check: Are transitions active?
        if (!shouldTransition) {
          console.error(`❌❌❌ [${componentId.current}] CRITICAL: Transitions NOT enabled during language change!`);
        }
      }
    }
    
    // Force browser reflow to ensure transition is recognized
    // This is crucial for making animations work reliably
    if (enLayerRef.current) {
      void enLayerRef.current.offsetHeight; // Force reflow
    }
    if (jaLayerRef.current) {
      void jaLayerRef.current.offsetHeight; // Force reflow
    }
    
    // Update states based on new language
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      
      if (DEBUG) {
        console.log(`🎯 [${componentId.current}] Applying new states in RAF`, {
          language,
          timestamp: Date.now()
        });
      }
      
      // Batch state updates using React 18's automatic batching
      // This prevents multiple re-renders
      if (language === 'en') {
        // English becomes active, Japanese fades out
        setEnState({
          opacity: 1,
          transform: 'translate3d(0, 0, 0) scale(1)',
          filter: 'blur(0) saturate(1)',
          zIndex: 2
        });
        setJaState({
          opacity: 0,
          transform: 'translate3d(0, -4%, 0) scale(0.98)',
          filter: 'blur(0.8px) saturate(0.95)',
          zIndex: 1
        });
      } else {
        // Japanese becomes active, English fades out
        setJaState({
          opacity: 1,
          transform: 'translate3d(0, 0, 0) scale(1)',
          filter: 'blur(0) saturate(1)',
          zIndex: 2
        });
        setEnState({
          opacity: 0,
          transform: 'translate3d(0, -4%, 0) scale(0.98)',
          filter: 'blur(0.8px) saturate(0.95)',
          zIndex: 1
        });
      }
      
      previousLanguageRef.current = language;
      
      // Check computed styles AFTER state change
      setTimeout(() => {
        if (DEBUG && enLayerRef.current && jaLayerRef.current) {
          const enStyles = window.getComputedStyle(enLayerRef.current);
          const jaStyles = window.getComputedStyle(jaLayerRef.current);
          console.log(`📊 [${componentId.current}] Computed styles AFTER (100ms):`, {
            en: {
              opacity: enStyles.opacity,
              transform: enStyles.transform,
              transition: enStyles.transition
            },
            ja: {
              opacity: jaStyles.opacity,
              transform: jaStyles.transform,
              transition: jaStyles.transition
            }
          });
        }
      }, 100);
    });
  }, [language, shouldTransition]);

  // Build transition style string - memoized to prevent re-renders
  const transitionStyle = useMemo(() => 
    shouldTransition 
      ? `opacity ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}, transform ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}, filter ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}`
      : 'none',
    [shouldTransition]
  );

  // Memoize style objects to prevent unnecessary re-renders
  const enStyleObject = useMemo(() => ({
    opacity: enState.opacity,
    transform: enState.transform,
    filter: enState.filter,
    zIndex: enState.zIndex,
    transition: transitionStyle,
    willChange: shouldTransition ? 'opacity, transform, filter' : 'auto'
  }), [enState, transitionStyle, shouldTransition]);

  const jaStyleObject = useMemo(() => ({
    opacity: jaState.opacity,
    transform: jaState.transform,
    filter: jaState.filter,
    zIndex: jaState.zIndex,
    transition: transitionStyle,
    willChange: shouldTransition ? 'opacity, transform, filter' : 'auto'
  }), [jaState, transitionStyle, shouldTransition]);

  if (DEBUG) {
    console.log(`🎭 [${componentId.current}] Transition style:`, {
      shouldTransition,
      transitionStyle: transitionStyle.substring(0, 50) + '...',
      timestamp: Date.now()
    });
  }

  // Debug: Check actual DOM styles after render - only on language change
  useEffect(() => {
    const id = componentId.current;
    const shouldTrans = shouldTransition;
    const transStyle = transitionStyle;
    
    if (DEBUG && enLayerRef.current && jaLayerRef.current) {
      // Use setTimeout to check after React has updated the DOM
      const timeoutId = setTimeout(() => {
        if (!enLayerRef.current || !jaLayerRef.current) return;
        const enStyles = window.getComputedStyle(enLayerRef.current);
        const jaStyles = window.getComputedStyle(jaLayerRef.current);
        console.log(`🔍 [${id}] ACTUAL DOM STYLES:`, {
          en: {
            opacity: enStyles.opacity,
            transition: enStyles.transition ? enStyles.transition.substring(0, 100) + '...' : 'none',
            transform: enStyles.transform
          },
          ja: {
            opacity: jaStyles.opacity,
            transition: jaStyles.transition ? jaStyles.transition.substring(0, 100) + '...' : 'none',
            transform: jaStyles.transform
          },
          shouldTransition: shouldTrans,
          transitionStyleApplied: transStyle.substring(0, 50) + '...'
        });
        
        // Check if transition is actually "none" when it shouldn't be
        if (shouldTrans && (enStyles.transition === 'none 0s ease 0s' || jaStyles.transition === 'none 0s ease 0s')) {
          console.error(`❌ [${id}] TRANSITION NOT APPLIED!`, {
            shouldTransition: shouldTrans,
            enTransition: enStyles.transition,
            jaTransition: jaStyles.transition
          });
        }
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [language, shouldTransition, transitionStyle]); // Added missing deps

  return (
    <span
      className={`brand-wordmark${className ? ` ${className}` : ''}`}
      aria-label={activeLabel}
      data-language={language}
    >
      {/* English Layer - Always rendered */}
      <span
        ref={enLayerRef}
        className="brand-wordmark__layer brand-wordmark__layer--en"
        aria-hidden="true"
        style={enStyleObject}
      >
        {englishLabel}
      </span>
      
      {/* Japanese Layer - Always rendered */}
      <span
        ref={jaLayerRef}
        className="brand-wordmark__layer brand-wordmark__layer--ja"
        aria-hidden="true"
        style={jaStyleObject}
      >
        {japaneseLabel}
      </span>
    </span>
  );
}
