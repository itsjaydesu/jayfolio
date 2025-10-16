"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../lib/translations";

export default function RetroMenu({
  id,
  items,
  activeSection,
  status,
  onStatusChange,
  activeStatus,
  isOpen = false,
  onNavigate,
  variant = "sidebar",
  onFieldEffect,
  hasActiveEffect = false,
  activeEffectInfo = null,
  onRipple,
}) {
  // Panel transition states: 'closed' | 'fading' | 'opening' | 'open' | 'closing'
  // 'fading' = menu is fading out, panel not visible yet
  const [panelState, setPanelState] = useState("closed");
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const toggleRef = useRef(null);
  const panelTimerRef = useRef(null);
  const panelAnimFrameRef = useRef(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipTimerRef = useRef(null);

  // Language context
  const { language, changeLanguage } = useLanguage();

  const fieldEffectsLabel = useMemo(
    () => t("menu.field-effects", language),
    [language]
  );

  const effectLabels = useMemo(
    () => ({
      calmReset: t("effects.calmReset", language),
      jitter: t("effects.jitter", language),
      swirlPulse: t("effects.swirlPulse", language),
      spiralFlow: t("effects.spiralFlow", language),
      riverFlow: t("effects.riverFlow", language),
      mandelbrotZoom: t("effects.mandelbrotZoom", language),
      reactionDiffusionBloom: t("effects.reactionDiffusionBloom", language),
      harmonicPendulum: t("effects.harmonicPendulum", language),
      starfield: t("effects.starfield", language),
      zenMode: t("effects.calmReset", language),
    }),
    [language]
  );

  const effectTooltips = useMemo(
    () => ({
      calmReset: t("effects.calmReset.tooltip", language),
      jitter: t("effects.jitter.tooltip", language),
      swirlPulse: t("effects.swirlPulse.tooltip", language),
      spiralFlow: t("effects.spiralFlow.tooltip", language),
      riverFlow: t("effects.riverFlow.tooltip", language),
      mandelbrotZoom: t("effects.mandelbrotZoom.tooltip", language),
      reactionDiffusionBloom: t(
        "effects.reactionDiffusionBloom.tooltip",
        language
      ),
      harmonicPendulum: t("effects.harmonicPendulum.tooltip", language),
      starfield: t("effects.starfield.tooltip", language),
      zenMode: t("effects.calmReset.tooltip", language),
    }),
    [language]
  );

  const languageToggleTooltip =
    language === "en"
      ? t("language.toggle.tooltip.en", language)
      : t("language.toggle.tooltip.ja", language);

  const languageToggleAria =
    language === "en"
      ? t("language.toggle.aria.en", language)
      : t("language.toggle.aria.ja", language);

  // Check for reduced motion preference
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Calculate panel position and start opening transition
  useEffect(() => {
    if (panelState === "opening" && toggleRef.current) {
      const menuElement = toggleRef.current.closest(".retro-menu");
      if (menuElement) {
        const menuRect = menuElement.getBoundingClientRect();
        const panelWidth = Math.min(menuRect.width - 4, 380); // Slightly smaller than menu
        const viewportWidth = window.innerWidth;

        // Find the titlebar to calculate overlay position
        const titlebar = menuElement.querySelector(".retro-menu__titlebar");

        // Calculate top position to overlay the menu body area
        // Position panel to replace the menu navbar area
        let topPos = menuRect.top;
        if (titlebar) {
          // Align panel with the menu top for cleaner overlay
          topPos = menuRect.top; // Align with menu top
        }

        // Calculate left position, ensuring panel stays within viewport
        let leftPos = menuRect.left;
        const rightEdge = leftPos + panelWidth;

        // If panel would go off right edge, adjust left position
        if (rightEdge > viewportWidth - 20) {
          // 20px margin from edge
          leftPos = viewportWidth - panelWidth - 20;
        }

        // If panel would go off left edge, adjust
        if (leftPos < 20) {
          leftPos = 20;
        }

        const newPosition = {
          top: topPos,
          left: leftPos,
          width: panelWidth,
        };

        setPanelPosition(newPosition);

        // Trigger transition to 'open' state after position is set
        // Skip delay if reduced motion is preferred
        if (prefersReducedMotion.current) {
          setPanelState("open");
        } else {
          panelAnimFrameRef.current = requestAnimationFrame(() => {
            setPanelState("open");
          });
        }
      }
    }
  }, [panelState]);

  // Handle click outside to close panel
  useEffect(() => {
    const isOpen = panelState === "opening" || panelState === "open";

    if (isOpen) {
      const handleClickOutside = (e) => {
        if (
          !e.target.closest(".retro-menu__settings-panel") &&
          !e.target.closest(".retro-menu__settings-toggle")
        ) {
          closePanel();
        }
      };

      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [panelState]);

  // Open panel with transition
  const openPanel = () => {
    // Clear any pending timers
    if (panelTimerRef.current) {
      clearTimeout(panelTimerRef.current);
      panelTimerRef.current = null;
    }
    if (panelAnimFrameRef.current) {
      cancelAnimationFrame(panelAnimFrameRef.current);
      panelAnimFrameRef.current = null;
    }

    // SOLUTION: Two-phase transition
    // Phase 1: 'fading' state triggers menu fade-out via data-panel-active
    // Phase 2: After menu starts fading, show panel with 'opening' state
    setPanelState("fading");

    if (prefersReducedMotion.current) {
      // No delay for reduced motion
      setPanelState("opening");
    } else {
      // Delay panel appearance to allow menu opacity to decrease
      panelTimerRef.current = setTimeout(() => {
        setPanelState("opening");
        panelTimerRef.current = null;
      }, 150); // 150ms allows menu to visibly start fading
    }
  };

  // Close panel with transition
  const closePanel = () => {
    // Clear any pending timers
    if (panelTimerRef.current) {
      clearTimeout(panelTimerRef.current);
      panelTimerRef.current = null;
    }
    if (panelAnimFrameRef.current) {
      cancelAnimationFrame(panelAnimFrameRef.current);
      panelAnimFrameRef.current = null;
    }

    // If reduced motion, close immediately
    if (prefersReducedMotion.current) {
      setPanelState("closed");
      return;
    }

    setPanelState("closing");

    // Wait for panel to fade out before menu starts fading in
    panelTimerRef.current = setTimeout(() => {
      setPanelState("closed");
      panelTimerRef.current = null;
      // Menu will now slowly fade back in over 0.8s
    }, 680); // Panel fade-out duration
  };

  // Toggle panel
  const togglePanel = () => {
    const isOpen = panelState === "opening" || panelState === "open";

    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  };

  // Update countdown timer
  useEffect(() => {
    if (activeEffectInfo && activeEffectInfo.duration && tooltipVisible) {
      const updateCountdown = () => {
        const elapsed = (Date.now() - activeEffectInfo.startTime) / 1000;
        const remaining = Math.max(0, activeEffectInfo.duration - elapsed);
        setRemainingTime(Math.ceil(remaining));

        if (remaining > 0) {
          tooltipTimerRef.current = requestAnimationFrame(updateCountdown);
        }
      };
      updateCountdown();

      return () => {
        if (tooltipTimerRef.current) {
          cancelAnimationFrame(tooltipTimerRef.current);
        }
      };
    }
  }, [activeEffectInfo, tooltipVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (panelTimerRef.current) {
        clearTimeout(panelTimerRef.current);
      }
      if (panelAnimFrameRef.current) {
        cancelAnimationFrame(panelAnimFrameRef.current);
      }
      if (tooltipTimerRef.current) {
        cancelAnimationFrame(tooltipTimerRef.current);
      }
    };
  }, []);

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
      className={`retro-menu retro-menu--${variant}${isOpen ? " is-open" : ""}`}
      data-open={isOpen}
      data-panel-active={
        panelState === "fading" ||
        panelState === "opening" ||
        panelState === "open"
          ? "true"
          : "false"
      }
      data-effect-active={hasActiveEffect ? "true" : "false"}
      aria-label="Main navigation"
    >
      <div className="retro-menu__titlebar">
        <span>
          <span className="indicator" aria-hidden="true" /> jayfolio
        </span>
        <div className="retro-menu__title-actions">
          <button
            type="button"
            className="retro-menu__language-toggle"
            onClick={() => {
              const newLang = language === "en" ? "ja" : "en";
              changeLanguage(newLang);

              // Trigger a localized ripple animation at the menu position
              // This creates a ripple effect without changing the field effect state
              if (onRipple) {
                // Random position near center for variety
                const x = (Math.random() - 0.5) * 0.3;
                const z = (Math.random() - 0.5) * 0.3;
                const strength = 0.7; // Moderate strength ripple
                onRipple(x, z, strength);
              }
            }}
            aria-label={languageToggleAria}
            title={languageToggleTooltip}
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Earth circle */}
              <circle cx="10" cy="10" r="7" fill="none" />

              {/* Continents/landmasses - simplified Earth-like shapes */}
              {/* Europe/Africa */}
              <path
                d="M 10 5 Q 11 6 10.5 8 T 11 10 Q 10 11 10.5 12"
                fill="none"
                strokeWidth="1.2"
              />

              {/* Americas */}
              <path
                d="M 6 7 Q 7 8 6.5 9 T 7 11"
                fill="none"
                strokeWidth="1.2"
              />

              {/* Asia/Pacific */}
              <path d="M 13 8 Q 14 9 13.5 10" fill="none" strokeWidth="1.2" />

              {/* Latitude lines */}
              <ellipse
                cx="10"
                cy="10"
                rx="7"
                ry="2.5"
                fill="none"
                strokeWidth="0.8"
                opacity="0.4"
              />
              <ellipse
                cx="10"
                cy="10"
                rx="5"
                ry="1.8"
                fill="none"
                strokeWidth="0.8"
                opacity="0.3"
                transform="translate(0,-3)"
              />
              <ellipse
                cx="10"
                cy="10"
                rx="5"
                ry="1.8"
                fill="none"
                strokeWidth="0.8"
                opacity="0.3"
                transform="translate(0,3)"
              />
            </svg>
          </button>
          <div className="retro-menu__settings-wrapper">
            <button
              ref={toggleRef}
              type="button"
              className={`retro-menu__settings-toggle${
                panelState === "opening" || panelState === "open"
                  ? " is-active"
                  : ""
              }`}
              onClick={togglePanel}
              onMouseEnter={() => {
                if (toggleRef.current && activeEffectInfo) {
                  const rect = toggleRef.current.getBoundingClientRect();
                  setTooltipPosition({
                    top: rect.top - 10, // Position above the button
                    left: rect.left + rect.width / 2,
                  });
                }
                setTooltipVisible(true);
              }}
              onMouseLeave={() => setTooltipVisible(false)}
              aria-expanded={panelState === "opening" || panelState === "open"}
              aria-label={fieldEffectsLabel}
              title={!tooltipVisible ? fieldEffectsLabel : undefined}
            >
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="10" cy="10" r="3" />
                <path d="M10 3.5v-1m0 15v-1m6.5-6.5h1m-15 0h1" />
                <path d="M14.5 5.5l.7-.7m-10.4 10.4l.7-.7m0-9.4l-.7-.7m10.4 10.4l-.7-.7" />
              </svg>
            </button>
            {tooltipVisible && activeEffectInfo && (
              <div
                className="retro-menu__tooltip"
                style={{
                  top: `${tooltipPosition.top - 40}px`, // Adjust to appear above button
                  left: `${tooltipPosition.left}px`,
                }}
              >
                <div className="retro-menu__tooltip-content">
                  <div className="retro-menu__tooltip-effect">
                    {t("menu.tooltip.effect-active", language, {
                      effect:
                        effectLabels[activeEffectInfo.type] ||
                        activeEffectInfo.name,
                    })}
                  </div>
                  {activeEffectInfo.duration && remainingTime !== null && (
                    <div className="retro-menu__tooltip-timer">
                      {t("menu.tooltip.reset-timer", language, {
                        seconds: remainingTime,
                      })}
                    </div>
                  )}
                  {!activeEffectInfo.duration && (
                    <div className="retro-menu__tooltip-info">
                      {t("menu.tooltip.no-auto-reset", language)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Link
            href="https://x.com/itsjaydesu"
            target="_blank"
            rel="noreferrer noopener"
            className="retro-menu__social"
            aria-label={t("menu.social.aria", language)}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M15.95 1h-1.62l-3.58 4.31L7.79 1H3.25l5.32 7.16L3.25 19h1.62l3.92-4.78L12.21 19h4.54l-5.58-7.4zM11.6 11.52 8.46 7.27l1.6-1.92 4.63 6.17z" />
            </svg>
          </Link>
          <small>v4.1</small>
          <button
            type="button"
            className="retro-menu__dismiss"
            onClick={handleDismiss}
          >
            {t("menu.close", language)}
          </button>
        </div>
      </div>
      <div className="retro-menu__body">
        <ul className="retro-menu__list">
          {items.map((item) => {
            const isActive = item.id === activeSection;
            const handlePreview = () => {
              if (!onStatusChange) return;
              onStatusChange({
                ...item.status,
                modeKey: isActive ? "active" : "preview",
              });
            };

            const handleClick = () => {
              if (onNavigate) {
                onNavigate();
              }
              handleRestore();
            };

            return (
              <li
                key={item.id}
                className={`retro-menu__item${isActive ? " is-active" : ""}`}
                data-section={item.id}
              >
                <Link
                  href={item.href}
                  className="retro-menu__button"
                  aria-current={isActive ? "page" : undefined}
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
      {/* Only render when actually opening/open, not during 'fading' state */}
      {(panelState === "opening" ||
        panelState === "open" ||
        panelState === "closing") &&
        onFieldEffect &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className={`retro-menu__settings-panel${
              panelState === "open" ? " is-visible" : ""
            }${panelState === "closing" ? " is-closing" : ""}`}
            style={{
              display: "block",
              position: "fixed",
              top: `${panelPosition.top}px`,
              left: `${panelPosition.left}px`,
              width: `${panelPosition.width}px`,
              zIndex: 99999,
              background:
                "linear-gradient(180deg, rgba(0, 58, 99, 0.96), rgba(0, 139, 178, 0.92))",
              border: "1.5px solid rgba(0, 200, 208, 0.5)",
              borderRadius: "20px",
              padding: "1rem",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="retro-menu__settings-header">
              <span>{fieldEffectsLabel}</span>
            </div>
            <div className="retro-menu__settings-content">
              <button
                type="button"
                className="retro-menu__effect-btn"
                style={{ gridColumn: "span 2", width: "100%" }}
                onClick={() => {
                  onFieldEffect("calmReset");
                  closePanel();
                }}
                title={effectTooltips.calmReset}
              >
                <span>{effectLabels.calmReset}</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("jitter");
                  closePanel();
                }}
                title={effectTooltips.jitter}
              >
                <span>{effectLabels.jitter}</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("swirlPulse");
                  closePanel();
                }}
                title={effectTooltips.swirlPulse}
              >
                <span>{effectLabels.swirlPulse}</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("spiralFlow");
                  closePanel();
                }}
                title={effectTooltips.spiralFlow}
              >
                <span>{effectLabels.spiralFlow}</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("riverFlow");
                  closePanel();
                }}
                title={effectTooltips.riverFlow}
              >
                <span>{effectLabels.riverFlow}</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("mandelbrotZoom");
                  closePanel();
                }}
                title={effectTooltips.mandelbrotZoom}
              >
                <span>{effectLabels.mandelbrotZoom}</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("reactionDiffusionBloom");
                  closePanel();
                }}
                title={effectTooltips.reactionDiffusionBloom}
              >
                <span>{effectLabels.reactionDiffusionBloom}</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("harmonicPendulum");
                  closePanel();
                }}
                title={effectTooltips.harmonicPendulum}
              >
                <span>{effectLabels.harmonicPendulum}</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("starfield");
                  closePanel();
                }}
                title={effectTooltips.starfield}
              >
                <span>{effectLabels.starfield}</span>
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
