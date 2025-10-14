
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedContent, getLocalizedTags } from '../../lib/translations';

export default function AboutContent({ initialContent }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  // Use dynamic data with fallbacks
  const title = getLocalizedContent(initialContent.aboutTitle, language) || 'About';
  const subtitle = getLocalizedContent(initialContent.aboutSubtitle, language) || 'Creative Technologist';
  const content =
    getLocalizedContent(initialContent.aboutContent, language) || initialContent.lead || '';
  const detailCards = Array.isArray(initialContent.aboutDetailCards)
    ? initialContent.aboutDetailCards
        .map((card) => ({
          title: getLocalizedContent(card.title, language),
          text: getLocalizedContent(card.text, language)
        }))
        .filter((card) => card.title || card.text)
    : [];
  const tags = getLocalizedTags(initialContent.aboutTags, language);

  return (
    <section className={`clean-about-page ${isLoaded ? 'is-loaded' : ''}`}>
      <div className="clean-about-page__background">
        <div className="clean-about-page__gradient" />
      </div>
      
      <div className="clean-about-page__container">
        <header className="clean-about-page__header">
          <h1 className="clean-about-page__title">{title}</h1>
          <p className="clean-about-page__subtitle">{subtitle}</p>
        </header>
        
        <main className="clean-about-page__main">
          <div className="clean-about-page__text-content">
            <div 
              className="clean-about-page__lead"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
          
          {detailCards.length > 0 && (
            <div className="clean-about-page__cards">
              {detailCards.map((card, index) => (
                <article key={index} className="clean-about-page__card">
                  <h2 className="clean-about-page__card-title">{card.title}</h2>
                  <p className="clean-about-page__card-text">
                    {card.text}
                  </p>
                </article>
              ))}
            </div>
          )}
          
          {tags.length > 0 && (
            <footer className="clean-about-page__footer">
              <div className="clean-about-page__tags">
                {tags.map((tag, index) => (
                  <span key={index} className="clean-about-page__tag">
                    {tag}
                  </span>
                ))}
              </div>
            </footer>
          )}
        </main>
      </div>
    </section>
  );
}
