'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { XLogoIcon } from './icons';

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Fallback SVG backgrounds if no admin image is set
const FALLBACK_BACKGROUNDS = {
  home: '/images/footer/home.svg',
  about: '/images/footer/about.svg',
  projects: '/images/footer/projects.svg',
  content: '/images/footer/content.svg',
  sounds: '/images/footer/sounds.svg',
  art: '/images/footer/art.svg',
  'work-with-me': '/images/footer/work-with-me.svg',
  default: '/images/footer/home.svg'
};

function resolveFooterConfig(pathname, channelContent) {
  const segments = pathname?.split('/').filter(Boolean) ?? [];
  const section = segments[0] ?? 'home';

  if (section === 'about') {
    const aboutContent = channelContent?.about ?? {};
    return {
      backgroundImage: aboutContent.aboutBackgroundImage || '',
      fadeSettings: aboutContent.aboutFooterFadeSettings || null
    };
  }

  const sectionContent = channelContent?.[section] ?? {};
  return {
    backgroundImage: sectionContent.backgroundImage || '',
    fadeSettings: sectionContent.footerFadeSettings || null
  };
}

export default function SiteFooter({ className = '', channelContent = {} }) {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef(null);

  const { backgroundImage: adminFooterImage, fadeSettings } = useMemo(
    () => resolveFooterConfig(pathname, channelContent),
    [pathname, channelContent]
  );

  // Determine which background image to use
  const backgroundImage = useMemo(() => {
    // Use admin-uploaded image if available
    if (adminFooterImage) {
      return adminFooterImage;
    }
    // Otherwise use fallback SVG based on current path
    const segments = pathname?.split('/').filter(Boolean) ?? [];
    const fallback = !segments.length 
      ? FALLBACK_BACKGROUNDS.home
      : FALLBACK_BACKGROUNDS[segments[0]] || FALLBACK_BACKGROUNDS.default;
    return fallback;
  }, [pathname, adminFooterImage]);

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
  }, [backgroundImage, fadeSettings]);

  const socialLinks = [
    {
      id: 'x',
      href: 'https://x.com/itsjaydesu',
      label: `Follow Jay on X`,
      icon: XLogoIcon
    },
    // {
    //   id: 'instagram',
    //   href: 'https://instagram.com/itsjaydesu',
    //   label: `See Jay on Instagram`,
    //   icon: InstagramIcon
    // },
    // {
    //   id: 'are.na',
    //   href: 'https://www.are.na/jay',
    //   label: `Jay on Are.na`,
    //   icon: () => (
    //     <svg
    //       viewBox="0 0 24 24"
    //       fill="none"
    //       xmlns="http://www.w3.org/2000/svg"
    //       className="site-footer__social-icon"
    //     >
    //       <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    //     </svg>
    //   )
    // }
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (!validateEmail(email)) {
      setStatus({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'pending', message: 'Sending something lovely to your inbox…' });

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        const message = result?.message || 'Something went wrong. Please try again shortly.';
        setStatus({ type: 'error', message });
        return;
      }

      setStatus({ type: 'success', message: result.message || "You're on the list. Thanks for tuning in." });
      setEmail('');
    } catch (error) {
      console.error('Failed to subscribe email', error);
      setStatus({ type: 'error', message: 'We could not reach the server. Please try again soon.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerClasses = ['site-footer'];
  if (className) footerClasses.push(className);
  if (isVisible) footerClasses.push('site-footer--visible');

  const scaleMode = fadeSettings?.bgScale ? fadeSettings.bgScale.toLowerCase() : 'cover';

  // Build CSS variables from fade settings
  const footerStyle = useMemo(() => {
    const style = {};

    if (fadeSettings) {
      const rawPosition = fadeSettings.bgPosition || 'bottom';
      const scaleValue = (fadeSettings.bgScale || 'cover').toLowerCase();
      
      // Parse position value for proper alignment
      // Admin can use: 'bottom', 'center', 'top', or numeric values (0-100)
      let positionValue = 'bottom'; // Default to bottom alignment
      
      // Handle different position formats
      if (rawPosition === 'bottom' || rawPosition === 0 || rawPosition === '0') {
        positionValue = 'bottom';
      } else if (rawPosition === 'top' || rawPosition === 100 || rawPosition === '100') {
        positionValue = 'top';
      } else if (rawPosition === 'center' || rawPosition === 50 || rawPosition === '50') {
        positionValue = 'center';
      } else if (typeof rawPosition === 'number' || !isNaN(parseFloat(rawPosition))) {
        // For numeric values, convert to percentage
        const numValue = typeof rawPosition === 'number' ? rawPosition : parseFloat(rawPosition);
        // Map 0 to bottom, 100 to top (inverted for intuitive control)
        const invertedValue = 100 - numValue;
        positionValue = `${Math.max(0, Math.min(100, invertedValue))}%`;
      } else if (rawPosition) {
        // Use the raw string value if it's a valid CSS position
        positionValue = rawPosition.toString().trim();
      }

      // Log only in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Footer Config:', {
          path: pathname,
          scale: scaleMode,
          position: positionValue,
          hasFades: (fadeSettings.topFadeHeight > 0 || fadeSettings.bottomFadeHeight > 0)
        });
      }

      style['--footer-bg-position'] = positionValue;
      style['--footer-bg-scale'] = scaleValue;
      style['--top-fade-height'] = `${fadeSettings.topFadeHeight || 0}%`;
      style['--top-fade-start'] = fadeSettings.topFadeOpacity || 1;
      style['--bottom-fade-height'] = `${fadeSettings.bottomFadeHeight || 0}%`;
      style['--bottom-fade-start'] = fadeSettings.bottomFadeOpacity || 0;
      style['--side-fade-width'] = `${fadeSettings.sideFadeWidth || 0}%`;
      style['--side-fade-start'] = fadeSettings.sideFadeOpacity || 0;
    } else {
      // No fade settings, use sensible defaults
      style['--footer-bg-position'] = 'bottom'; // Bottom alignment
      style['--footer-bg-scale'] = 'cover';

    }

    return style;
  }, [fadeSettings, pathname, scaleMode]);

  return (
    <footer
      ref={footerRef}
      className={footerClasses.join(' ')}
      aria-label="Site footer with newsletter signup"
      style={footerStyle}
      data-bg-scale={scaleMode || 'cover'}
      data-has-image={backgroundImage ? 'true' : 'false'}
    >
      <div className="site-footer__background" aria-hidden="true">
        {backgroundImage ? (
          <Image
            src={backgroundImage}
            alt=""
            fill
            sizes="100vw"
            priority={false}
            className="site-footer__background-image"
          />
        ) : null}
      </div>
      {/* Side fade gradients for smoother edges */}
      <div className="site-footer__side-fade site-footer__side-fade--left" />
      <div className="site-footer__side-fade site-footer__side-fade--right" />

      <div className="site-footer__container">
        <div className="site-footer__content">
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
            
            <form
              className="site-footer__form"
              onSubmit={handleSubmit}
              noValidate
              aria-busy={isSubmitting ? 'true' : 'false'}
            >
              <div className="site-footer__input-wrapper">
                <svg className="site-footer__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 7L12 13L21 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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
                  aria-describedby="email-description"
                  aria-disabled={isSubmitting ? 'true' : undefined}
                  disabled={isSubmitting}
                />
                <p id="email-description" className="sr-only">
                  Receive very occasional updates when Jay releases something. Enter your email to get maybe one email a month.
                </p>
                <div className="site-footer__helper" aria-hidden="true">
                  Receive very occasional updates when Jay releases something. Enter your email to get maybe one email a month.
                </div>
              </div>
              {status.message && (
                <p
                  className={`site-footer__status${status.type === 'success' ? ' site-footer__status--success' : ''}${status.type === 'error' ? ' site-footer__status--error' : ''}`}
                  aria-live="polite"
                >
                  {status.message}
                </p>
              )}
            </form>
            
            {/* <Link href="/work-with-me" className="site-footer__cta">
              <span className="site-footer__cta-label">WORK WITH ME</span>
            </Link> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
