'use client';

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Wraps the primary site shell to coordinate the fade-through animation
 * during language swaps. By centralising the opacity/blur animation we
 * avoid sprinkling transition logic across every localized component.
 */
export default function LanguageTransitionRoot({ children }) {
  const { language, previousLanguage, isTransitioning } = useLanguage();

  return (
    <div
      className="language-transition-root"
      data-language-current={language}
      data-language-previous={previousLanguage}
      data-language-transitioning={isTransitioning ? 'true' : 'false'}
    >
      {children}
    </div>
  );
}
