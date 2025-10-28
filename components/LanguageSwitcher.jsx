'use client';

import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';

/**
 * LanguageSwitcher - A single Earth icon language toggle component
 */
export default function LanguageSwitcher({ className = '' }) {
  const { language, changeLanguage, isClient } = useLanguage();

  if (!isClient) {
    return null; // Don't render during server-side rendering
  }

  const handleLanguageToggle = (event) => {
    const newLanguage = language === 'en' ? 'ja' : 'en';
    const target = event?.currentTarget;
    const rect = target?.getBoundingClientRect();
    const fallbackX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
    const fallbackY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;
    const hasClientX = Number.isFinite(event?.clientX);
    const hasClientY = Number.isFinite(event?.clientY);
    const originX = hasClientX ? event.clientX : rect ? rect.left + rect.width / 2 : fallbackX;
    const originY = hasClientY ? event.clientY : rect ? rect.top + rect.height / 2 : fallbackY;

    changeLanguage(newLanguage, {
      originX,
      originY,
      from: language,
      to: newLanguage,
      source: 'header-toggle',
    });
  };

  const tooltipKey = language === 'en' ? 'language.toggle.tooltip.en' : 'language.toggle.tooltip.ja';
  const ariaKey = language === 'en' ? 'language.toggle.aria.en' : 'language.toggle.aria.ja';

  return (
    <button
      className={`language-switcher-compact ${className}`}
      onClick={handleLanguageToggle}
      title={t(tooltipKey, language)}
      aria-label={t(ariaKey, language)}
    >
      <svg className="earth-icon-compact" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    </button>
  );
}
