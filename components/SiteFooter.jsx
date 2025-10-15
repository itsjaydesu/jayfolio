'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { InstagramIcon, XLogoIcon } from './icons';

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const FOOTER_SCENES = {
  home: {
    glow: 'rgba(255, 140, 90, 0.4)',
    horizon: 'rgba(100, 180, 255, 0.15)'
  },
  about: {
    glow: 'rgba(232, 210, 255, 0.35)',
    horizon: 'rgba(180, 160, 255, 0.12)'
  },
  projects: {
    glow: 'rgba(126, 248, 210, 0.4)',
    horizon: 'rgba(80, 200, 180, 0.15)'
  },
  content: {
    glow: 'rgba(248, 222, 174, 0.35)',
    horizon: 'rgba(255, 200, 120, 0.12)'
  },
  sounds: {
    glow: 'rgba(154, 214, 255, 0.4)',
    horizon: 'rgba(100, 160, 255, 0.15)'
  },
  art: {
    glow: 'rgba(242, 176, 255, 0.35)',
    horizon: 'rgba(200, 140, 255, 0.12)'
  },
  'work-with-me': {
    glow: 'rgba(124, 255, 206, 0.4)',
    horizon: 'rgba(80, 220, 180, 0.15)'
  },
  default: {
    glow: 'rgba(255, 140, 90, 0.4)',
    horizon: 'rgba(100, 180, 255, 0.15)'
  }
};

export default function SiteFooter({ className = '' }) {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef(null);

  const sceneKey = useMemo(() => {
    const segments = pathname?.split('/').filter(Boolean) ?? [];
    if (!segments.length) return 'home';
    const first = segments[0];
    if (FOOTER_SCENES[first]) {
      return first;
    }
    return 'default';
  }, [pathname]);

  const sceneConfig = FOOTER_SCENES[sceneKey] ?? FOOTER_SCENES.default;

  const footerStyle = useMemo(() => ({
    '--footer-scene-glow': sceneConfig.glow,
    '--footer-scene-horizon': sceneConfig.horizon
  }), [sceneConfig]);

  useEffect(() => {
    const node = footerRef.current;
    if (!node) {
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const socialLinks = [
    {
      id: 'x',
      href: 'https://x.com/itsjaydesu',
      label: `Follow Jay on X`,
      icon: XLogoIcon
    },
    {
      id: 'instagram',
      href: 'https://instagram.com/itsjaydesu',
      label: `See Jay on Instagram`,
      icon: InstagramIcon
    },
    {
      id: 'are.na',
      href: 'https://www.are.na/jay',
      label: `Jay on Are.na`,
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="site-footer__social-icon"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    }
  ];

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateEmail(email)) {
      setStatus({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }

    setStatus({ type: 'success', message: "You're on the list. Thanks for tuning in." });
    setEmail('');
  };

  const footerClasses = ['site-footer'];
  if (className) footerClasses.push(className);
  if (isVisible) footerClasses.push('site-footer--visible');

  footerClasses.push(`site-footer--${sceneKey}`);

  return (
    <footer
      ref={footerRef}
      className={footerClasses.join(' ')}
      aria-labelledby="site-footer-heading"
      data-footer-scene={sceneKey}
      style={footerStyle}
    >
      <div className="site-footer__backdrop" aria-hidden="true">
        <div className="site-footer__horizon" />
        <div className="site-footer__glow" />
      </div>
      <div className="site-footer__container">
        <div className="site-footer__content">
          <h2 id="site-footer-heading" className="site-footer__headline">
            Keep a friendly pulse on what<br />Jay ships next.
          </h2>
          <p className="site-footer__description">
            Receive very occasional updates when Jay releases something?<br />
            Enter your email to get maybe one email a month, amoth.
          </p>
          <form className="site-footer__form" onSubmit={handleSubmit} noValidate>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status.type !== 'idle') {
                  setStatus({ type: 'idle', message: '' });
                }
              }}
              placeholder="your@email.com"
              className="site-footer__input"
              aria-label="Email address"
            />
            {status.message && (
              <p
                className={`site-footer__status${status.type === 'success' ? ' site-footer__status--success' : ''}${status.type === 'error' ? ' site-footer__status--error' : ''}`}
                aria-live="polite"
              >
                {status.message}
              </p>
            )}
          </form>
          <div className="site-footer__links">
            <nav className="site-footer__social" aria-label="Social links">
              <ul className="site-footer__social-list">
                {socialLinks.map(({ id, href, label, icon: Icon }) => (
                  <li key={id} className="site-footer__social-item">
                    <a
                      href={href}
                      className="site-footer__social-link"
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={label}
                      title={label}
                    >
                      <Icon className="site-footer__social-icon" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <Link href="/work-with-me" className="site-footer__cta">
              <span className="site-footer__cta-label">WORK WITH ME</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
