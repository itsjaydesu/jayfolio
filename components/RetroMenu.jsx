'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function RetroMenu({
  id,
  items,
  activeSection,
  status,
  onStatusChange,
  activeStatus,
  isOpen = false,
  onNavigate,
  variant = 'sidebar',
  onFieldEffect
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const toggleRef = useRef(null);
  
  useEffect(() => {
    if (settingsOpen && toggleRef.current) {
      const menuElement = toggleRef.current.closest('.retro-menu');
      if (menuElement) {
        const menuRect = menuElement.getBoundingClientRect();
        const panelWidth = Math.min(menuRect.width, 400); // Max width 400px
        const viewportWidth = window.innerWidth;
        
        // Calculate left position, ensuring panel stays within viewport
        let leftPos = menuRect.left;
        const rightEdge = leftPos + panelWidth;
        
        // If panel would go off right edge, adjust left position
        if (rightEdge > viewportWidth - 20) { // 20px margin from edge
          leftPos = viewportWidth - panelWidth - 20;
        }
        
        // If panel would go off left edge, adjust
        if (leftPos < 20) {
          leftPos = 20;
        }
        
        const newPosition = {
          top: menuRect.bottom + 8,
          left: leftPos,
          width: panelWidth
        };
        
        setPanelPosition(newPosition);
      }
    }
  }, [settingsOpen]);
  
  useEffect(() => {
    if (settingsOpen) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('.retro-menu__settings-panel') && 
            !e.target.closest('.retro-menu__settings-toggle')) {
          setSettingsOpen(false);
        }
      };
      
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [settingsOpen]);

  const handleRestore = () => {
    if (onStatusChange) {
      onStatusChange(activeStatus);
    }
  };

  const handleDismiss = () => {
    if (onStatusChange) {
      onStatusChange(activeStatus);
    }
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <nav
      id={id}
      className={`retro-menu retro-menu--${variant}${isOpen ? ' is-open' : ''}`}
      data-open={isOpen}
      aria-label="Main navigation"
    >
      <div className="retro-menu__titlebar">
        <span>
          <span className="indicator" aria-hidden="true" /> Jay Winder
        </span>
        <div className="retro-menu__title-actions">
          <button
            ref={toggleRef}
            type="button"
            className={`retro-menu__settings-toggle${settingsOpen ? ' is-active' : ''}`}
            onClick={() => setSettingsOpen(!settingsOpen)}
            aria-expanded={settingsOpen}
            aria-label="Toggle field effects settings"
            title="Field Effects"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="10" cy="10" r="3" />
              <path d="M10 3.5v-1m0 15v-1m6.5-6.5h1m-15 0h1" />
              <path d="M14.5 5.5l.7-.7m-10.4 10.4l.7-.7m0-9.4l-.7-.7m10.4 10.4l-.7-.7" />
            </svg>
          </button>
          <Link
            href="https://x.com/itsjaydesu"
            target="_blank"
            rel="noreferrer noopener"
            className="retro-menu__social"
            aria-label="Open Jay Winder's X profile"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M15.95 1h-1.62l-3.58 4.31L7.79 1H3.25l5.32 7.16L3.25 19h1.62l3.92-4.78L12.21 19h4.54l-5.58-7.4zM11.6 11.52 8.46 7.27l1.6-1.92 4.63 6.17z" />
            </svg>
          </Link>
          <small>v4.1</small>
          <button type="button" className="retro-menu__dismiss" onClick={handleDismiss}>
            Close
          </button>
        </div>
      </div>
      <div className="retro-menu__body">
        <ul className="retro-menu__list">
          {items.map((item) => {
            const isActive = item.id === activeSection;
            const handlePreview = () => {
              if (!onStatusChange) return;
              onStatusChange({ ...item.status, mode: isActive ? 'active' : 'preview' });
            };

            const handleClick = () => {
              if (onNavigate) {
                onNavigate();
              }
              handleRestore();
            };

            return (
              <li key={item.id} className={`retro-menu__item${isActive ? ' is-active' : ''}`} data-section={item.id}>
                <Link
                  href={item.href}
                  className="retro-menu__button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={handleClick}
                  onMouseEnter={handlePreview}
                  onMouseLeave={handleRestore}
                  onFocus={handlePreview}
                  onBlur={handleRestore}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Render settings panel via Portal to avoid overflow clipping */}
      {settingsOpen && onFieldEffect && typeof window !== 'undefined' && createPortal(
        <div 
          className="retro-menu__settings-panel" 
          style={{ 
            display: 'block',
            position: 'fixed',
            top: `${panelPosition.top}px`,
            left: `${panelPosition.left}px`,
            width: `${panelPosition.width}px`,
            zIndex: 99999,
            background: 'linear-gradient(180deg, rgba(0, 58, 99, 0.98), rgba(0, 139, 178, 0.95))',
            border: '2px solid rgba(0, 200, 208, 0.6)',
            borderRadius: '8px',
            padding: '0.8rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
          }}
        >
          <div className="retro-menu__settings-header">
            <span>Field Effects</span>
          </div>
          <div className="retro-menu__settings-content">
            <button
              type="button"
              className="retro-menu__effect-btn"
              style={{ gridColumn: 'span 2', width: '100%' }}
              onClick={() => {
                onFieldEffect('calmReset');
                setSettingsOpen(false);
              }}
              title="Reset to default state"
            >
              <span>Zen</span>
            </button>
            <button
              type="button"
              className="retro-menu__effect-btn"
              onClick={() => {
                onFieldEffect('jitter');
                setSettingsOpen(false);
              }}
              title="Trigger rapid ripple bursts"
            >
              <span>Jitter</span>
            </button>
            <button
              type="button"
              className="retro-menu__effect-btn"
              onClick={() => {
                onFieldEffect('swirlPulse');
                setSettingsOpen(false);
              }}
              title="Enhance swirl motion"
            >
              <span>Swirl</span>
            </button>
            <button
              type="button"
              className="retro-menu__effect-btn"
              onClick={() => {
                onFieldEffect('spiralFlow');
                setSettingsOpen(false);
              }}
              title="Unfurl logarithmic spiral currents"
            >
              <span>Spiral</span>
            </button>
            <button
              type="button"
              className="retro-menu__effect-btn"
              onClick={() => {
                onFieldEffect('riverFlow');
                setSettingsOpen(false);
              }}
              title="Flow along layered currents"
            >
              <span>River Flow</span>
            </button>
            <button
              type="button"
              className="retro-menu__effect-btn"
              onClick={() => {
                onFieldEffect('mandelbrotZoom');
                setSettingsOpen(false);
              }}
              title="Dive through a Julia set zoom"
            >
              <span>Hop</span>
            </button>
            <button
              type="button"
              className="retro-menu__effect-btn"
              onClick={() => {
                onFieldEffect('reactionDiffusionBloom');
                setSettingsOpen(false);
              }}
              title="Grow Gray-Scott bloom patterns"
            >
              <span>Bloom</span>
            </button>
            <button
              type="button"
              className="retro-menu__effect-btn"
              onClick={() => {
                onFieldEffect('harmonicPendulum');
                setSettingsOpen(false);
              }}
              title="Trace chaotic harmonic pendulums"
            >
              <span>Blink</span>
            </button>
            <button
              type="button"
              className="retro-menu__effect-btn"
              onClick={() => {
                onFieldEffect('starfield');
                setSettingsOpen(false);
              }}
              title="Bloom into a drifting starfield"
            >
              <span>Stars</span>
            </button>
          </div>
        </div>,
        document.body
      )}
      <p className="retro-menu__status" aria-live="polite">
        <strong>{status.title}</strong>
        <em>{status.description}</em>
        <span>{status.mode}</span>
      </p>
    </nav>
  );
}
