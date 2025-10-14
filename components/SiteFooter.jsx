'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRightIcon, InstagramIcon, XLogoIcon, YouTubeIcon } from './icons';

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function SiteFooter({ className = '' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });

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

  return (
    <footer className={['site-footer', className].filter(Boolean).join(' ')} aria-labelledby="site-footer-heading">
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
