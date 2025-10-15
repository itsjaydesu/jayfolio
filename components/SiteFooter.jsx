'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { InstagramIcon, XLogoIcon } from './icons';

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

export default function SiteFooter({ className = '' }) {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isVisible, setIsVisible] = useState(false);
  const [adminFooterImage, setAdminFooterImage] = useState('');
  const [fadeSettings, setFadeSettings] = useState(null);
  const footerRef = useRef(null);

  // Fetch page-specific background image and fade settings
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const segments = pathname?.split('/').filter(Boolean) ?? [];
        let backgroundImage = '';
        let settings = null;
        
        // Check if we're on a content/blog post page with a slug
        if (segments.length === 2) {
          const [section, slug] = segments;
          const contentTypes = ['projects', 'content', 'sounds', 'art'];
          
          if (contentTypes.includes(section)) {
            // Fetch the specific content item
            const res = await fetch(`/api/content/${section}`);
            if (res.ok) {
              const data = await res.json();
              const entry = data.entries?.find(e => e.slug === slug);
              if (entry?.backgroundImage) {
                backgroundImage = entry.backgroundImage;
              }
              // TODO: Add per-post fade settings if needed
            }
          }
        }
        
        // If no content-specific image, check channel backgrounds
        if (segments.length > 0) {
          const res = await fetch('/api/channel-content');
          if (res.ok) {
            const data = await res.json();
            const section = segments[0];
            
            if (section === 'about') {
              if (!backgroundImage) {
                backgroundImage = data.content?.about?.aboutBackgroundImage || '';
              }
              settings = data.content?.about?.aboutFooterFadeSettings || null;
            } else if (data.content?.[section]) {
              if (!backgroundImage) {
                backgroundImage = data.content[section]?.backgroundImage || '';
              }
              settings = data.content[section]?.footerFadeSettings || null;
            }
          }
        }
        
        console.log('🔍 SiteFooter Background Debug:', {
          path: pathname,
          segments,
          backgroundImage,
          hasBackgroundImage: Boolean(backgroundImage),
          fadeSettings: settings
        });
        
        if (!ignore) {
          setAdminFooterImage(backgroundImage || '');
          setFadeSettings(settings);
        }
      } catch (error) {
        console.error('Failed to load footer background:', error);
      }
    })();
    return () => { ignore = true; };
  }, [pathname]);

  // Determine which background image to use
  const backgroundImage = useMemo(() => {
    // Use admin-uploaded image if available
    if (adminFooterImage) {
      console.log('🎨 Using admin footer image:', adminFooterImage);
      return adminFooterImage;
    }
    // Otherwise use fallback SVG based on current path
    const segments = pathname?.split('/').filter(Boolean) ?? [];
    const fallback = !segments.length 
      ? FALLBACK_BACKGROUNDS.home
      : FALLBACK_BACKGROUNDS[segments[0]] || FALLBACK_BACKGROUNDS.default;
    console.log('🎨 Using fallback SVG:', fallback, 'for path:', pathname);
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

  // Build CSS variables from fade settings
  const footerStyle = useMemo(() => {
    const style = {
      backgroundImage: `url(${backgroundImage})`
    };
    
    if (fadeSettings) {
      style['--footer-bg-position'] = `${fadeSettings.bgPosition}%`;
      style['--top-fade-height'] = `${fadeSettings.topFadeHeight}%`;
      style['--top-fade-start'] = fadeSettings.topFadeOpacity;
      style['--bottom-fade-height'] = `${fadeSettings.bottomFadeHeight}%`;
      style['--bottom-fade-start'] = fadeSettings.bottomFadeOpacity;
      style['--side-fade-width'] = `${fadeSettings.sideFadeWidth}%`;
      style['--side-fade-start'] = fadeSettings.sideFadeOpacity;
    }
    
    return style;
  }, [backgroundImage, fadeSettings]);

  return (
    <footer
      ref={footerRef}
      className={footerClasses.join(' ')}
      aria-label="Site footer with newsletter signup"
      style={footerStyle}
    >
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
            
            <form className="site-footer__form" onSubmit={handleSubmit} noValidate>
              <div className="site-footer__input-wrapper">
                <p className="site-footer__description" id="email-description">
                  Receive very occasional updates when Jay releases something?<br />
                  Enter your email to get maybe one email a month, amoth.
                </p>
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
              />
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
            
            <Link href="/work-with-me" className="site-footer__cta">
              <span className="site-footer__cta-label">WORK WITH ME</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
