'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { detectLanguage, saveLanguagePreference, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../lib/i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [isClient, setIsClient] = useState(false);

  // Initialize language on client side
  useEffect(() => {
    setIsClient(true);
    const detectedLanguage = detectLanguage();
    setLanguage(detectedLanguage);
    // Set the lang attribute on the HTML element
    if (typeof window !== 'undefined') {
      document.documentElement.lang = detectedLanguage;
    }
  }, []);

  // Change language with persistence and smooth crossfade effect
  const changeLanguage = (newLanguage) => {
    if (SUPPORTED_LANGUAGES[newLanguage]) {
      console.log('🌐 LanguageContext: Starting language change', {
        from: language,
        to: newLanguage,
        timestamp: Date.now()
      });
      
      // Immediate language change for smoother transition
      setLanguage(newLanguage);
      saveLanguagePreference(newLanguage);
      
      if (typeof window !== 'undefined') {
        document.documentElement.lang = newLanguage;
        
        // Add subtle pulse effect during transition
        console.log('➕ Adding data-language-transitioning attribute', { timestamp: Date.now() });
        document.body.setAttribute('data-language-transitioning', 'true');
        
        // Remove transition state after animation completes
        setTimeout(() => {
          console.log('➖ Removing data-language-transitioning attribute', { timestamp: Date.now() });
          document.body.removeAttribute('data-language-transitioning');
        }, 650); // Match the longer transition duration
      }
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
