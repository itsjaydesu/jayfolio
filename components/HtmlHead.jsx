'use client';

import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getLocale } from '../lib/i18n';

/**
 * HtmlHead - Client component to update document attributes based on language
 */
export default function HtmlHead() {
  const { language, isClient } = useLanguage();

  useEffect(() => {
    if (!isClient) return;

    // Update HTML lang attribute
    const html = document.documentElement;
    const locale = getLocale(language);
    
    html.lang = language;
    
    // Also set locale for better accessibility and SEO
    if (!html.getAttribute('data-locale')) {
      html.setAttribute('data-locale', locale);
    } else {
      html.setAttribute('data-locale', locale);
    }
  }, [language, isClient]);

  return null; // This component doesn't render anything
}
