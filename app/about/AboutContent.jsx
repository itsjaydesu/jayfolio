
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAdminStatus } from '../../lib/useAdminStatus';
import { getLocalizedContent, getLocalizedTags } from '../../lib/translations';

export default function AboutContent({ initialContent }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { language } = useLanguage();
  const { isAdmin } = useAdminStatus();

  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  // Use dynamic data with fallbacks
  const backgroundImage = initialContent.aboutBackgroundImage || '';
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

  const editHref = '/administratorrrr/settings/channel/about';

  const canEdit = Boolean(isAdmin);
  const headerClassName = ['clean-about-page__header'];
  if (canEdit) {
    headerClassName.push('clean-about-page__header--editable');
  }

  return (
    <section className={`clean-about-page ${isLoaded ? 'is-loaded' : ''} ${backgroundImage ? 'has-background-image' : ''}`}>
      <div className="clean-about-page__background">
        {backgroundImage && (
          <img 
            src={backgroundImage} 
            alt="" 
            className="clean-about-page__background-image"
            aria-hidden="true"
          />
        )}
        <div className="clean-about-page__gradient" />
      </div>
      
      <div className="clean-about-page__container">
        <header className={headerClassName.join(' ')}>
          <div className="clean-about-page__header-row">
            <div className="clean-about-page__heading">
              <h1 className="clean-about-page__title">{title}</h1>
              <p className="clean-about-page__subtitle">{subtitle}</p>
            </div>
            {canEdit ? (
              <Link href={editHref} className="clean-about-page__edit-btn">
                Edit About
              </Link>
            ) : null}
          </div>
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
