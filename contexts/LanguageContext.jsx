'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { detectLanguage, saveLanguagePreference, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../lib/i18n';

const LanguageContext = createContext();

const LANGUAGE_TRANSITION_MS = 800;
const LANGUAGE_TRANSITION_EASING = 'cubic-bezier(0.33, 1, 0.68, 1)';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [isClient, setIsClient] = useState(false);
  const transitionTimerRef = useRef(null);
  const isTransitioningRef = useRef(false);

  // Initialize language on client side
  useEffect(() => {
    setIsClient(true);
    const detectedLanguage = detectLanguage();
    setLanguage(detectedLanguage);
    // Set the lang attribute on the HTML element
    if (typeof window !== 'undefined') {
      document.documentElement.lang = detectedLanguage;
      const body = document.body;
      if (body) {
        body.style.setProperty('--language-transition-duration', `${LANGUAGE_TRANSITION_MS}ms`);
        body.style.setProperty('--language-transition-easing', LANGUAGE_TRANSITION_EASING);
      }
    }
  }, []);

  useEffect(() => () => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
      isTransitioningRef.current = false;
    }
  }, []);

  // Change language with persistence and smooth crossfade effect
  const changeLanguage = (newLanguage, options = {}) => {
    if (!SUPPORTED_LANGUAGES[newLanguage] || newLanguage === language) {
      return;
    }

    if (isTransitioningRef.current) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[LanguageContext] changeLanguage ignored (pending transition)', {
          currentLanguage: language,
          requestedLanguage: newLanguage,
        });
      }
      return;
    }

    const { originX, originY, from = language, to = newLanguage, source } = options;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[LanguageContext] changeLanguage invoked', {
        fromLanguage: language,
        toLanguage: newLanguage,
        originX,
        originY,
        source,
      });
    }

    // Immediate language change for smoother transition
    setLanguage(newLanguage);
    saveLanguagePreference(newLanguage);
    
    if (typeof window !== 'undefined') {
      const body = document.body;
      if (!body) {
        return;
      }

      const { innerWidth, innerHeight } = window;
      const fallbackX = innerWidth ? innerWidth / 2 : 0;
      const fallbackY = innerHeight ? innerHeight / 2 : 0;
      const resolvedX = typeof originX === 'number' && !Number.isNaN(originX) ? originX : fallbackX;
      const resolvedY = typeof originY === 'number' && !Number.isNaN(originY) ? originY : fallbackY;

      document.documentElement.lang = newLanguage;
      body.setAttribute('data-language-transitioning', 'true');
      body.style.setProperty('--language-transition-duration', `${LANGUAGE_TRANSITION_MS}ms`);
      body.style.setProperty('--language-transition-easing', LANGUAGE_TRANSITION_EASING);
      body.style.setProperty('--lang-origin-x', `${resolvedX}px`);
      body.style.setProperty('--lang-origin-y', `${resolvedY}px`);

      const detail = {
        from,
        to,
        originX: resolvedX,
        originY: resolvedY,
        duration: LANGUAGE_TRANSITION_MS,
        easing: LANGUAGE_TRANSITION_EASING,
      };

      if (source) {
        detail.source = source;
      }

      try {
        window.dispatchEvent(new CustomEvent('languagechange:start', { detail }));
      } catch {
        // Silently ignore dispatch errors (older browsers / SSR mocks)
      }

      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }

      isTransitioningRef.current = true;

      if (process.env.NODE_ENV !== 'production') {
        requestAnimationFrame(() => {
          const attr = body.getAttribute('data-language-transitioning');
          console.log('[LanguageContext] transition armed', {
            attr,
            htmlLang: document.documentElement.lang,
            origin: { x: resolvedX, y: resolvedY },
            duration: LANGUAGE_TRANSITION_MS,
            easing: LANGUAGE_TRANSITION_EASING,
          });
        });
      }

      transitionTimerRef.current = window.setTimeout(() => {
        body.removeAttribute('data-language-transitioning');
        isTransitioningRef.current = false;
        transitionTimerRef.current = null;

        if (process.env.NODE_ENV !== 'production') {
          console.log('[LanguageContext] transition completed', {
            finalLanguage: document.documentElement.lang,
            attr: body.getAttribute('data-language-transitioning'),
          });
        }
      }, LANGUAGE_TRANSITION_MS);
    }
  };

  // Provide context value
  const contextValue = {
    language,
    changeLanguage,
    isClient,
    isJapanese: language === 'ja',
    isEnglish: language === 'en',
    supportedLanguages: SUPPORTED_LANGUAGES
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
