'use client';

import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';

export default function HomeLanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();

  const handleToggle = () => {
    const newLang = language === 'en' ? 'ja' : 'en';
    changeLanguage(newLang);
  };

  const tooltipKey = language === 'en' ? 'language.toggle.tooltip.en' : 'language.toggle.tooltip.ja';
  const ariaKey = language === 'en' ? 'language.toggle.aria.en' : 'language.toggle.aria.ja';

  return (
    <button
      onClick={handleToggle}
      className="home-language-toggle"
      aria-label={t(ariaKey, language)}
      title={t(tooltipKey, language)}
    >
      <svg
        className="home-language-icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M12 3 C 16 8, 16 16, 12 21"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M12 3 C 8 8, 8 16, 12 21"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <line
          x1="3"
          y1="12"
          x2="21"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="9"
          ry="4"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <span className="home-language-label">
        {language === 'en' ? 'EN' : 'JA'}
      </span>
    </button>
  );
}
