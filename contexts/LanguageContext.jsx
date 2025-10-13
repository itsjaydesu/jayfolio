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
  }, []);

  // Change language with persistence
  const changeLanguage = (newLanguage) => {
    if (SUPPORTED_LANGUAGES[newLanguage]) {
      setLanguage(newLanguage);
      saveLanguagePreference(newLanguage);
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
