'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpRightIcon, InstagramIcon, XLogoIcon, YouTubeIcon } from './icons';

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const FOOTER_SCENES = {
  home: {
    image: '/images/footer/home.svg',
    tint: 'rgba(8, 22, 34, 0.82)',
    glow: 'rgba(126, 242, 255, 0.22)',
    focus: '50% 38%'
  },
  about: {
    image: '/images/footer/about.svg',
    tint: 'rgba(12, 16, 28, 0.86)',
    glow: 'rgba(232, 210, 255, 0.2)',
    focus: '50% 40%'
  },
  projects: {
    image: '/images/footer/projects.svg',
    tint: 'rgba(4, 18, 28, 0.88)',
    glow: 'rgba(126, 248, 210, 0.26)',
    focus: '48% 42%'
  },
  content: {
    image: '/images/footer/content.svg',
    tint: 'rgba(6, 14, 24, 0.88)',
    glow: 'rgba(248, 222, 174, 0.2)',
    focus: '50% 44%'
  },
  sounds: {
    image: '/images/footer/sounds.svg',
    tint: 'rgba(4, 12, 24, 0.9)',
    glow: 'rgba(154, 214, 255, 0.24)',
    focus: '50% 42%'
  },
  art: {
    image: '/images/footer/art.svg',
    tint: 'rgba(10, 16, 24, 0.9)',
    glow: 'rgba(242, 176, 255, 0.24)',
    focus: '51% 40%'
  },
  'work-with-me': {
    image: '/images/footer/work-with-me.svg',
    tint: 'rgba(6, 12, 20, 0.9)',
    glow: 'rgba(124, 255, 206, 0.24)',
    focus: '48% 43%'
  },
  default: {
    image: '/images/footer/home.svg',
    tint: 'rgba(6, 18, 26, 0.86)',
    glow: 'rgba(128, 236, 255, 0.18)',
    focus: '50% 40%'
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
    '--footer-scene-image': `url(${sceneConfig.image})`,
    '--footer-scene-tint': sceneConfig.tint,
    '--footer-scene-glow': sceneConfig.glow,
    '--footer-scene-focus': sceneConfig.focus
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
      id: 'youtube',
      href: 'https://www.youtube.com/@itsjaydesu',
      label: `Watch Jay on YouTube`,
      icon: YouTubeIcon
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
        <div className="site-footer__backdrop-layer site-footer__backdrop-layer--image" />
        <div className="site-footer__backdrop-layer site-footer__backdrop-layer--tint" />
        <div className="site-footer__backdrop-layer site-footer__backdrop-layer--mist" />
        <div className="site-footer__backdrop-layer site-footer__backdrop-layer--glow" />
      </div>
      <div className="site-footer__container">
        <div className="site-footer__content">
          <h2 id="site-footer-heading" className="site-footer__headline">
            Keep a friendly pulse on what Jay ships next.
          </h2>
          <p className="site-footer__description">
            Receive very occassional updates when Jay releases something? Enter your email to get maybe one email a month. Cancel instantly anytime.
          </p>
          <form className="site-footer__form" onSubmit={handleSubmit} noValidate>
            <div className="site-footer__input-group">
              <div className="site-footer__input-wrap">
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
              </div>
              <button type="submit" className="site-footer__submit">
                Notify me
              </button>
            </div>
            <p
              className={`site-footer__status${status.type === 'success' ? ' site-footer__status--success' : ''}${status.type === 'error' ? ' site-footer__status--error' : ''}`}
              aria-live="polite"
            >
              {status.message}
            </p>
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
              <span className="site-footer__cta-label">Work with me</span>
              <ArrowUpRightIcon className="site-footer__cta-icon" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
