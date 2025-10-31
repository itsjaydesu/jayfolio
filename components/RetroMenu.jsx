"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  const panelRepositionFrameRef = useRef(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipTimerRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

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

  const updatePanelPosition = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const toggleElement = toggleRef.current;
    if (!toggleElement) {
      return null;
    }

    const menuElement = toggleElement.closest(".retro-menu");
    if (!menuElement) {
      return null;
    }

    const menuRect = menuElement.getBoundingClientRect();
    if (!menuRect || menuRect.width === 0) {
      return null;
    }

    const visualViewport = window.visualViewport;
    const viewportWidth =
      visualViewport?.width ?? window.innerWidth ?? menuRect.width;
    const viewportHeight =
      visualViewport?.height ?? window.innerHeight ?? menuRect.height;
    const viewportOffsetLeft = visualViewport?.offsetLeft ?? 0;
    const viewportOffsetTop = visualViewport?.offsetTop ?? 0;

    const layoutWidth = menuElement.offsetWidth || menuRect.width;
    const fallbackWidth = layoutWidth > 0 ? layoutWidth : menuRect.width;
    const desiredWidth = Math.min(Math.max(fallbackWidth, 0), 420);
    const safeMarginBase = (fallbackWidth || viewportWidth || 0) * 0.04;
    const maxMargin =
      viewportWidth > 0 ? Math.max(12, Math.min(48, viewportWidth / 2 - 8)) : 48;
    const safeMargin = Math.max(
      12,
      Math.min(
        48,
        Number.isFinite(safeMarginBase) ? safeMarginBase : 0,
        maxMargin
      )
    );

    const availableWidth =
      viewportWidth > 0 ? viewportWidth - safeMargin * 2 : fallbackWidth;

    let panelWidth = desiredWidth;
    if (Number.isFinite(availableWidth) && availableWidth > 0) {
      panelWidth = Math.min(panelWidth, availableWidth);
    } else if (Number.isFinite(viewportWidth) && viewportWidth > 0) {
      panelWidth = Math.min(panelWidth, viewportWidth);
    }

    if (!Number.isFinite(panelWidth) || panelWidth <= 0) {
      const widthFallback =
        fallbackWidth > 0
          ? fallbackWidth
          : Number.isFinite(viewportWidth) && viewportWidth > 0
            ? viewportWidth
            : 280;
      panelWidth = widthFallback;
    }

    if (
      Number.isFinite(viewportWidth) &&
      viewportWidth > 0 &&
      panelWidth > viewportWidth
    ) {
      panelWidth = viewportWidth;
    }

    // Center panel relative to the toggle button, not the entire menu
    const toggleRect = toggleElement.getBoundingClientRect();
    let leftPos;
    if (!toggleRect || toggleRect.width === 0) {
      // Fallback to menu center if toggle rect is invalid
      const menuCenterX =
        viewportOffsetLeft + menuRect.left + menuRect.width / 2;
      leftPos = menuCenterX - panelWidth / 2;
    } else {
      const toggleCenterX = viewportOffsetLeft + toggleRect.left + toggleRect.width / 2;
      leftPos = toggleCenterX - panelWidth / 2;
    }

    if (Number.isFinite(viewportWidth) && viewportWidth > 0) {
      const minLeft = viewportOffsetLeft + safeMargin;
      const maxLeft =
        viewportOffsetLeft + viewportWidth - safeMargin - panelWidth;

      if (Number.isFinite(maxLeft) && maxLeft >= minLeft) {
        leftPos = Math.min(Math.max(leftPos, minLeft), maxLeft);
      } else {
        leftPos =
          viewportOffsetLeft + Math.max((viewportWidth - panelWidth) / 2, 0);
      }
    }

    const titlebar = menuElement.querySelector(".retro-menu__titlebar");
    let topPos = viewportOffsetTop + menuRect.top;

    if (titlebar) {
      const titlebarRect = titlebar.getBoundingClientRect();
      if (titlebarRect) {
        topPos = viewportOffsetTop + titlebarRect.top;
      }
    }

    if (!Number.isFinite(topPos)) {
      topPos = viewportOffsetTop;
    }

    if (Number.isFinite(viewportHeight) && viewportHeight > 0) {
      const maxTop = viewportOffsetTop + viewportHeight - safeMargin;
      if (topPos > maxTop) {
        topPos = maxTop;
      }
      if (topPos < viewportOffsetTop) {
        topPos = viewportOffsetTop;
      }
    }

    const nextPosition = {
      top: Math.max(topPos, 0),
      left: Math.max(leftPos, 0),
      width: panelWidth,
    };

    setPanelPosition((prev) => {
      if (
        prev &&
        Math.abs(prev.top - nextPosition.top) < 0.5 &&
        Math.abs(prev.left - nextPosition.left) < 0.5 &&
        Math.abs(prev.width - nextPosition.width) < 0.5
      ) {
        return prev;
      }
      return nextPosition;
    });

    return nextPosition;
  }, []);

  // Calculate panel position and start opening transition
  useEffect(() => {
    if (panelState === "opening") {
      updatePanelPosition();

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
  }, [panelState, updatePanelPosition]);

  useEffect(() => {
    if (panelState !== "open") {
      return undefined;
    }

    const handleViewportChange = () => {
      if (typeof window === "undefined") {
        return;
      }

      if (panelRepositionFrameRef.current) {
        cancelAnimationFrame(panelRepositionFrameRef.current);
      }

      panelRepositionFrameRef.current = requestAnimationFrame(() => {
        updatePanelPosition();
      });
    };

    // Initial sync in case viewport changed between "opening" and "open"
    handleViewportChange();

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, { passive: true });

    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener("resize", handleViewportChange);
      visualViewport.addEventListener("scroll", handleViewportChange);
    }

    const menuElement =
      toggleRef.current?.closest?.(".retro-menu") ?? null;
    let menuResizeObserver = null;

    if (menuElement && typeof ResizeObserver !== "undefined") {
      menuResizeObserver = new ResizeObserver(handleViewportChange);
      menuResizeObserver.observe(menuElement);
    }

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange);
      if (visualViewport) {
        visualViewport.removeEventListener("resize", handleViewportChange);
        visualViewport.removeEventListener("scroll", handleViewportChange);
      }
      if (menuResizeObserver) {
        menuResizeObserver.disconnect();
      }
      if (panelRepositionFrameRef.current) {
        cancelAnimationFrame(panelRepositionFrameRef.current);
        panelRepositionFrameRef.current = null;
      }
    };
  }, [panelState, updatePanelPosition]);

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

  // Enhanced scroll detection for background fade effect with requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    let rafId = null;

    const updateScrollPosition = () => {
      const scrollThreshold = 50;
      // Check all possible scroll sources for maximum compatibility
      const scrollY = Math.max(
        window.pageYOffset || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0,
        document.scrollingElement?.scrollTop || 0
      );
      
      const isScrolled = scrollY > scrollThreshold;
      setScrolled(isScrolled);
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    };

    // Listen to multiple scroll events for maximum compatibility
    window.addEventListener('scroll', requestTick, { passive: true });
    document.addEventListener('scroll', requestTick, { passive: true });
    
    // Initial check
    updateScrollPosition();

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', requestTick);
      document.removeEventListener('scroll', requestTick);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (panelTimerRef.current) {
        clearTimeout(panelTimerRef.current);
      }
      if (panelAnimFrameRef.current) {
        cancelAnimationFrame(panelAnimFrameRef.current);
      }
      if (panelRepositionFrameRef.current) {
        cancelAnimationFrame(panelRepositionFrameRef.current);
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

  const menuItems = Array.isArray(items) ? items : [];
  const totalMenuItems = menuItems.length;

  return (
    <nav
      id={id}
      className={`retro-menu retro-menu--${variant}${isOpen ? " is-open" : ""}`}
      data-open={isOpen}
      data-scrolled={scrolled ? "true" : "false"}
      data-panel-active={
        panelState === "fading" ||
        panelState === "opening" ||
        panelState === "open"
          ? "true"
          : "false"
      }
      data-effect-active={hasActiveEffect ? "true" : "false"}
      aria-label="Main navigation"
      style={{ "--menu-item-count": String(totalMenuItems) }}
    >
      <div className="retro-menu__titlebar">
        <span className="retro-menu__title">
          <span className="indicator" aria-hidden="true" />
          <span className="retro-menu__wordmark">jayfolio</span>
        </span>
        <div className="retro-menu__title-actions">
          <button
            type="button"
            className="retro-menu__language-toggle"
            onClick={(event) => {
              const newLang = language === "en" ? "ja" : "en";
              const target = event?.currentTarget;
              const rect = target?.getBoundingClientRect();
              const fallbackX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
              const fallbackY = typeof window !== "undefined" ? window.innerHeight / 2 : 0;
              const hasClientX = Number.isFinite(event?.clientX);
              const hasClientY = Number.isFinite(event?.clientY);
              const originX = hasClientX ? event.clientX : rect ? rect.left + rect.width / 2 : fallbackX;
              const originY = hasClientY ? event.clientY : rect ? rect.top + rect.height / 2 : fallbackY;

              changeLanguage(newLang, {
                originX,
                originY,
                from: language,
                to: newLang,
                source: "retro-menu-toggle",
              });

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
              className="retro-menu__icon retro-menu__icon--globe"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M12 5c2.2 2.1 3.5 4.7 3.5 7s-1.3 4.9-3.5 7"
                strokeWidth="1.1"
              />
              <path
                d="M12 5c-2.2 2.1-3.5 4.7-3.5 7s1.3 4.9 3.5 7"
                strokeWidth="1.1"
              />
              <circle cx="12" cy="12" r="7" strokeWidth="1.5" />
              <path
                d="M5 12h14"
                className="retro-menu__icon-accent"
                strokeWidth="1"
              />
              <path
                d="M7.2 8.3c1.2.6 2.4.9 4.8.9s3.6-.3 4.8-.9"
                className="retro-menu__icon-accent"
                strokeWidth="0.95"
              />
              <path
                d="M7.2 15.7c1.2-.6 2.4-.9 4.8-.9s3.6.3 4.8.9"
                className="retro-menu__icon-accent"
                strokeWidth="0.95"
              />
              <path
                d="M17.3 6.8a2.3 2.3 0 0 0 3-1.1"
                className="retro-menu__icon-accent retro-menu__icon-accent--faint"
                strokeWidth="0.85"
              />
              <path
                d="M6.7 17.2a2.3 2.3 0 0 0-3.1 1.1"
                className="retro-menu__icon-accent retro-menu__icon-accent--faint"
                strokeWidth="0.85"
              />
              <circle
                cx="12"
                cy="12"
                r="9.5"
                className="retro-menu__icon-accent retro-menu__icon-accent--halo"
                strokeWidth="0.4"
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
                className="retro-menu__icon retro-menu__icon--fx"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" strokeWidth="1.6" />
                <path d="M12 4.2v2.6M12 17.2v2.6" strokeWidth="1.2" />
                <path d="M4.2 12h2.6M17.2 12h2.6" strokeWidth="1.2" />
                <path d="M6.3 6.3l1.9 1.9M15.8 15.8l1.9 1.9" strokeWidth="1.2" />
                <path d="M6.3 17.7l1.9-1.9M15.8 8.2l1.9-1.9" strokeWidth="1.2" />
                <path
                  d="M8.4 12a3.6 3.6 0 0 1 3.6-3.6c.9 0 1.7.3 2.4.8"
                  className="retro-menu__icon-accent"
                  strokeWidth="1"
                />
                <path
                  d="M15.6 12a3.6 3.6 0 0 1-3.6 3.6c-.9 0-1.7-.3-2.4-.8"
                  className="retro-menu__icon-accent"
                  strokeWidth="1"
                />
                <path
                  d="M5.2 12c0-3.8 3-6.8 6.8-6.8 1.9 0 3.7.7 5 1.9"
                  className="retro-menu__icon-accent retro-menu__icon-accent--faint"
                  strokeWidth="0.9"
                />
                <path
                  d="M18.8 12c0 3.8-3 6.8-6.8 6.8-1.9 0-3.7-.7-5-1.9"
                  className="retro-menu__icon-accent retro-menu__icon-accent--faint"
                  strokeWidth="0.9"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9.5"
                  className="retro-menu__icon-accent retro-menu__icon-accent--halo"
                  strokeWidth="0.35"
                />
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
            <svg
              className="retro-menu__icon retro-menu__icon--social"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M5.1 5.4h4.2l2.7 4 2.7-4h4.2l-5.5 7.4 5.6 7.8h-4.2l-2.8-4.3-2.9 4.3H5.1l5.6-7.8z"
                strokeWidth="1.35"
              />
              <path
                d="M8.2 5.4l9.9 13.8"
                className="retro-menu__icon-accent"
                strokeWidth="0.9"
              />
              <path
                d="M15.8 5.4L5.9 19.2"
                className="retro-menu__icon-accent"
                strokeWidth="0.9"
              />
              <circle
                cx="18.7"
                cy="5"
                r="1.1"
                fill="currentColor"
                className="retro-menu__icon-dot"
              />
              <circle
                cx="18.7"
                cy="5"
                r="2"
                className="retro-menu__icon-accent retro-menu__icon-accent--halo"
                strokeWidth="0.35"
              />
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
        {/* Plan for sequential animation & status delays:
            1. Share the total item count with CSS so we avoid hard-coded nth-child rules.
            2. Tag each menu item with its index so transitions can cascade from top to bottom.
            3. Keep navigation handlers intact to preserve existing behavior on every screen size. */}
        <ul
          className="retro-menu__list"
          style={{ "--menu-item-count": String(totalMenuItems) }}
        >
          {menuItems.map((item, index) => {
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
                style={{ "--menu-item-index": String(index) }}
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
