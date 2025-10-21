'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowUpRightIcon } from '../../components/icons';

export default function WorkWithMePage() {
  const contactEmail = 'hello@jaywinder.com';
  const [scrolled, setScrolled] = useState(false);

  // Scroll detection for fade effect with progressive opacity
  useEffect(() => {
    let rafId = null;
    const scrollStart = 20;
    const scrollRange = 200;

    const handleScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const progress = Math.min(Math.max((scrollY - scrollStart) / scrollRange, 0), 1);

        const section = document.querySelector('.work-with-me');
        if (section) {
          section.style.setProperty('--scroll-progress', progress.toString());
          const isScrolled = progress > 0.05;
          if (isScrolled !== scrolled) {
            setScrolled(isScrolled);
          }
        }

        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [scrolled]);

  return (
    <section
      className="work-with-me"
      data-scrolled={scrolled ? "true" : "false"}
    >
      {/* Scroll fade overlay - always present */}
      <div className="work-with-me__scroll-overlay" aria-hidden="true" />

      <div className="work-with-me__background">
        <div className="work-with-me__gradient" />
        <div className="work-with-me__orb" />
      </div>
      <div className="work-with-me__container">
        <header className="work-with-me__header">
          <span className="work-with-me__eyebrow">Collaborations</span>
          <h1 className="work-with-me__title">Let&rsquo;s build luminous interfaces together.</h1>
          <p className="work-with-me__lead">
            I craft cinematic UI systems, sound-reactive environments, and experiential tools that make future-facing ideas feel tangible. If you&rsquo;re planning a product reveal, an installation, or something wild on the web, let&rsquo;s explore it.
          </p>
        </header>

        <div className="work-with-me__grid">
          <article className="work-with-me__card">
            <h2 className="work-with-me__card-title">Immersive product launches</h2>
            <p className="work-with-me__card-text">
              Design interactive launch moments with responsive visuals and audio that mirror your brand&rsquo;s pulse.
            </p>
          </article>
          <article className="work-with-me__card">
            <h2 className="work-with-me__card-title">Generative installations</h2>
            <p className="work-with-me__card-text">
              Craft spaces where motion, sound, and gesture-driven systems let guests feel the tech beating under the hood.
            </p>
          </article>
          <article className="work-with-me__card">
            <h2 className="work-with-me__card-title">Future UI prototyping</h2>
            <p className="work-with-me__card-text">
              Prototype interfaces for AR, spatial audio, or heads-up displays with rapid iteration and storytelling baked in.
            </p>
          </article>
        </div>

        <div className="work-with-me__cta">
          <a href={`mailto:${contactEmail}`} className="work-with-me__cta-button">
            Start a project
            <ArrowUpRightIcon className="work-with-me__cta-icon" />
          </a>
          <p className="work-with-me__cta-note">
            Prefer a quick chat? Mention your idea, ideal timeline, and any references. We&rsquo;ll reply within two sunsets.
          </p>
          <div className="work-with-me__alt-links">
            <Link href="/content" className="work-with-me__alt-link">Browse recent writing</Link>
            <Link href="/projects" className="work-with-me__alt-link">See project reels</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
