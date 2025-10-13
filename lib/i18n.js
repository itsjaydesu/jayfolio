// Internationalization utilities for jayfolio

export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', code: 'en', locale: 'en_US' },
  ja: { name: '日本語', code: 'ja', locale: 'ja_JP' }
};

export const DEFAULT_LANGUAGE = 'en';
export const JAPANESE_LANGUAGE = 'ja';

/**
 * Detect client preferred language
 * @returns {string} Language code ('en' or 'ja')
 */
export function detectLanguage() {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  // Check localStorage first for saved preference
  const savedLanguage = localStorage.getItem('jayfolio-language');
  if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
    return savedLanguage;
  }

  // Check browser language settings
  const browserLanguages = [
    navigator.language,
    ...(navigator.languages || [])
  ];

  // Look for Japanese language codes
  for (const lang of browserLanguages) {
    if (lang.startsWith('ja')) {
      return JAPANESE_LANGUAGE;
    }
    if (lang.startsWith('en')) {
      return 'en';
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Save language preference to localStorage
 * @param {string} languageCode - Language code to save
 */
export function saveLanguagePreference(languageCode) {
  if (typeof window === 'undefined') return;
  
  if (SUPPORTED_LANGUAGES[languageCode]) {
    localStorage.setItem('jayfolio-language', languageCode);
  }
}

/**
 * Get language display name
 * @param {string} languageCode - Language code
 * @returns {string} Display name
 */
export function getLanguageName(languageCode) {
  return SUPPORTED_LANGUAGES[languageCode]?.name || SUPPORTED_LANGUAGES['en'].name;
}

/**
 * Get locale code for SEO/metadata
 * @param {string} languageCode - Language code
 * @returns {string} Locale code (e.g., 'en_US', 'ja_JP')
 */
export function getLocale(languageCode) {
  return SUPPORTED_LANGUAGES[languageCode]?.locale || SUPPORTED_LANGUAGES['en'].locale;
}
