'use client';

import { useState } from 'react';

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function SiteFooter({ className = '' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });

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
        </div>
      </div>
    </footer>
  );
}
