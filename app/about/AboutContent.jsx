'use client';

import { useState, useEffect } from 'react';

export default function AboutContent({ initialContent }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  // Use dynamic data with fallbacks
  const title = initialContent.aboutTitle || 'About';
  const subtitle = initialContent.aboutSubtitle || 'Creative Technologist';
  const content = initialContent.aboutContent || initialContent.lead;
  const detailCards = initialContent.aboutDetailCards || [];
  const tags = initialContent.aboutTags || [];

  return (
    <section className={`glass-about-page ${isLoaded ? 'is-loaded' : ''}`}>
      <div className="glass-about-page__background">
        <div className="glass-about-page__orb glass-about-page__orb--1" />
        <div className="glass-about-page__orb glass-about-page__orb--2" />
        <div className="glass-about-page__orb glass-about-page__orb--3" />
      </div>
      
      <div className="glass-about-page__container">
        <div className="glass-about-page__header">
          <h1 className="glass-about-page__title">
            <span className="glass-about-page__title-main">{title}</span>
            <span className="glass-about-page__title-sub">{subtitle}</span>
          </h1>
          <div className="glass-about-page__divider" />
        </div>
        
        <div className="glass-about-page__content">
          <p className="glass-about-page__lead">
            {content}
          </p>
          
          {detailCards.length > 0 && (
            <div className="glass-about-page__details">
              {detailCards.map((card, index) => (
                <div key={index} className="glass-about-page__detail-card">
                  <h3 className="glass-about-page__detail-title">{card.title}</h3>
                  <p className="glass-about-page__detail-text">
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {tags.length > 0 && (
            <div className="glass-about-page__tags">
              {tags.map((tag, index) => (
                <span key={index} className="glass-about-page__tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
