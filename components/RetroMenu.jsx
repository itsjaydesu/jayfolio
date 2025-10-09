'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

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
  
  // Debug: Log props on mount and updates
  useEffect(() => {
    console.log('🔍 RetroMenu mounted/updated with props:', {
      variant,
      hasOnFieldEffect: !!onFieldEffect,
      onFieldEffectType: typeof onFieldEffect,
      isOpen,
      id
    });
  }, [variant, onFieldEffect, isOpen, id]);
  
  useEffect(() => {
    if (settingsOpen && toggleRef.current) {
      console.log('📍 Calculating panel position...');
      const menuElement = toggleRef.current.closest('.retro-menu');
      if (menuElement) {
        const menuRect = menuElement.getBoundingClientRect();
        const newPosition = {
          top: menuRect.bottom + 8,
          left: menuRect.left,
          width: menuRect.width
        };
        console.log('📍 Menu rect:', menuRect);
        console.log('📍 New panel position:', newPosition);
        console.log('📍 Window dimensions:', { 
          width: window.innerWidth, 
          height: window.innerHeight,
          scrollY: window.scrollY 
        });
        setPanelPosition(newPosition);
      } else {
        console.warn('⚠️ Could not find .retro-menu element!');
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
            onClick={() => {
              console.log('🔘 Settings toggle clicked!');
              console.log('🔘 Current state:', { settingsOpen, hasOnFieldEffect: !!onFieldEffect });
              setSettingsOpen(!settingsOpen);
            }}
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
      {(() => {
        const shouldRenderPanel = settingsOpen && onFieldEffect;
        console.log('🎨 Panel render check:', { 
          settingsOpen, 
          hasOnFieldEffect: !!onFieldEffect,
          shouldRenderPanel,
          panelPosition 
        });
        
        if (!shouldRenderPanel) {
          console.log('❌ Not rendering panel because:', {
            settingsOpenIs: settingsOpen,
            onFieldEffectIs: onFieldEffect
          });
          return null;
        }
        
        console.log('✅ Rendering panel at position:', panelPosition);
        
        return (
          <div 
            ref={(el) => {
              if (el) {
                console.log('📦 Panel DOM element mounted!', el);
                console.log('📦 Panel computed style:', window.getComputedStyle(el));
                console.log('📦 Panel rect:', el.getBoundingClientRect());
              }
            }}
            className="retro-menu__settings-panel" 
            style={{ 
              display: 'block',
              position: 'fixed',
              top: `${panelPosition.top}px`,
              left: `${panelPosition.left}px`,
              width: `${panelPosition.width}px`,
              zIndex: 9999,
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
              onClick={() => {
                onFieldEffect('dropBall');
                setSettingsOpen(false);
              }}
              title="Create a ripple from the center"
            >
              <span className="retro-menu__effect-icon">⚫</span>
              <span>Drop Ball</span>
            </button>
            <button
              type="button"
              className="retro-menu__effect-btn"
              onClick={() => {
                onFieldEffect('shockwave');
                setSettingsOpen(false);
              }}
              title="Create multiple ripples"
            >
              <span className="retro-menu__effect-icon">💫</span>
              <span>Shockwave</span>
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
              <span className="retro-menu__effect-icon">🌀</span>
              <span>Swirl Pulse</span>
            </button>
            <button
              type="button"
              className="retro-menu__effect-btn"
              onClick={() => {
                onFieldEffect('calmReset');
                setSettingsOpen(false);
              }}
              title="Reset to default state"
            >
              <span className="retro-menu__effect-icon">☯️</span>
              <span>Calm Reset</span>
            </button>
          </div>
        </div>
        );
      })()}
      <p className="retro-menu__status" aria-live="polite">
        <strong>{status.title}</strong>
        <em>{status.description}</em>
        <span>{status.mode}</span>
      </p>
    </nav>
  );
}
