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
        // Check for overflow and transform issues
        console.log('🔍 Checking parent hierarchy for issues...');
        let element = menuElement;
        while (element && element !== document.body) {
          const styles = window.getComputedStyle(element);
          const overflow = styles.overflow;
          const overflowX = styles.overflowX;
          const overflowY = styles.overflowY;
          const transform = styles.transform;
          const position = styles.position;
          
          if (overflow === 'hidden' || overflowX === 'hidden' || overflowY === 'hidden') {
            console.warn('⚠️ Found overflow:hidden on:', element.className, { overflow, overflowX, overflowY });
          }
          if (transform && transform !== 'none') {
            console.warn('⚠️ Found transform on:', element.className, transform);
          }
          if (position === 'fixed' || position === 'absolute') {
            console.log('📌 Found positioned parent:', element.className, position);
          }
          
          element = element.parentElement;
        }
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
        
        console.log('📍 Menu rect:', menuRect);
        console.log('📍 Calculated panel position:', newPosition);
        console.log('📍 Viewport width:', viewportWidth);
        console.log('📍 Panel right edge would be:', rightEdge);
        
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

  // Test: Create a simple visible element to verify rendering
  const testElement = settingsOpen ? (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'red',
        color: 'white',
        padding: '2rem',
        zIndex: 999999,
        fontSize: '2rem',
        border: '5px solid yellow'
      }}
    >
      TEST: Settings Panel Should Be Here
    </div>
  ) : null;

  return (
    <>
    {testElement}
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
        
        // First, test with a super simple element
        if (true) {  // Force render for testing
          return (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                height: '200px',
                background: 'lime',
                border: '10px solid red',
                zIndex: 999999,
                marginTop: '10px'
              }}
            >
              SIMPLE TEST PANEL - CAN YOU SEE THIS?
            </div>
          );
        }
        
        return (
          <div 
            ref={(el) => {
              if (el) {
                console.log('📦 Panel DOM element mounted!', el);
                const rect = el.getBoundingClientRect();
                console.log('📦 Panel rect:', rect);
                console.log('📦 Panel parent:', el.parentElement);
                console.log('📦 Panel offsetParent:', el.offsetParent);
                
                // Check actual visibility
                const computedStyle = window.getComputedStyle(el);
                console.log('📦 Panel visibility check:', {
                  display: computedStyle.display,
                  visibility: computedStyle.visibility,
                  opacity: computedStyle.opacity,
                  position: computedStyle.position,
                  zIndex: computedStyle.zIndex,
                  overflow: computedStyle.overflow
                });
                
                // Check if it's in viewport
                console.log('📦 Is panel in viewport?', {
                  inViewportHorizontally: rect.left >= 0 && rect.right <= window.innerWidth,
                  inViewportVertically: rect.top >= 0 && rect.bottom <= window.innerHeight,
                  hasSize: rect.width > 0 && rect.height > 0,
                  leftEdge: rect.left,
                  rightEdge: rect.right,
                  topEdge: rect.top,
                  bottomEdge: rect.bottom,
                  viewportWidth: window.innerWidth,
                  viewportHeight: window.innerHeight
                });
                
                // Check parent menu boundaries
                const menuEl = el.closest('.retro-menu');
                if (menuEl) {
                  const menuRect = menuEl.getBoundingClientRect();
                  console.log('📦 Panel vs Menu comparison:', {
                    menuRect,
                    panelRect: rect,
                    panelExtendsOutside: rect.bottom > menuRect.bottom || rect.right > menuRect.right,
                    menuHasOverflowHidden: window.getComputedStyle(menuEl).overflow
                  });
                }
              }
            }}
            className="retro-menu__settings-panel" 
            style={{ 
              display: 'block',
              position: 'fixed',
              top: `${panelPosition.top}px`,
              left: `${panelPosition.left}px`,
              width: `${panelPosition.width}px`,
              zIndex: 99999,  // Even higher z-index
              background: 'rgba(0, 58, 99, 0.98)',  // Solid color for visibility
              backgroundColor: 'rgba(0, 139, 178, 0.98)', // Fallback
              border: '3px solid #00c8d0',  // More visible border
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: '0 0 50px rgba(0, 200, 208, 0.8), 0 8px 24px rgba(0, 0, 0, 0.9)'  // Glowing shadow
            }}
          >
          <div className="retro-menu__settings-header" style={{ color: '#fff', marginBottom: '0.5rem' }}>
            <span>Field Effects</span>
          </div>
          <div className="retro-menu__settings-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className="retro-menu__effect-btn"
              onClick={() => {
                console.log('🎯 Drop Ball clicked!');
                onFieldEffect('dropBall');
                setSettingsOpen(false);
              }}
              title="Create a ripple from the center"
              style={{
                padding: '0.75rem',
                background: 'rgba(0, 116, 128, 0.6)',
                border: '2px solid #00c8d0',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <span className="retro-menu__effect-icon" style={{ fontSize: '1.5rem' }}>⚫</span>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Drop Ball</span>
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
    </>
  );
}
