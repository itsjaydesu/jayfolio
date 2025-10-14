'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';

// Animation configuration
const TRANSITION_DURATION_MS = 600; // Smooth transition duration
const TRANSITION_EASING = 'cubic-bezier(0.4, 0.0, 0.2, 1)'; // Smooth easing

export default function BrandWordmark({ className = '' }) {
  const { language } = useLanguage();
  const englishLabel = useMemo(() => t('brand.name', 'en'), []);
  const japaneseLabel = useMemo(() => t('brand.name', 'ja'), []);
  const activeLabel = t('brand.name', language);
  
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
  
  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Use useLayoutEffect to update styles before browser paint
  useLayoutEffect(() => {
    // Skip first render
    if (!shouldTransition) {
      setShouldTransition(true);
      return;
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
    });
  }, [language, shouldTransition]);

  // Build transition style string
  const transitionStyle = shouldTransition 
    ? `opacity ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}, transform ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}, filter ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}`
    : 'none';

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
        style={{
          opacity: enState.opacity,
          transform: enState.transform,
          filter: enState.filter,
          zIndex: enState.zIndex,
          transition: transitionStyle,
          // Ensure GPU acceleration
          willChange: shouldTransition ? 'opacity, transform, filter' : 'auto'
        }}
      >
        {englishLabel}
      </span>
      
      {/* Japanese Layer - Always rendered */}
      <span
        ref={jaLayerRef}
        className="brand-wordmark__layer brand-wordmark__layer--ja"
        aria-hidden="true"
        style={{
          opacity: jaState.opacity,
          transform: jaState.transform,
          filter: jaState.filter,
          zIndex: jaState.zIndex,
          transition: transitionStyle,
          // Ensure GPU acceleration
          willChange: shouldTransition ? 'opacity, transform, filter' : 'auto'
        }}
      >
        {japaneseLabel}
      </span>
    </span>
  );
}
