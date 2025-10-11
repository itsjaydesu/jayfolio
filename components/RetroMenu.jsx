"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

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
}) {
  // Panel transition states: 'closed' | 'fading' | 'opening' | 'open' | 'closing'
  // 'fading' = menu is fading out, panel not visible yet
  const [panelState, setPanelState] = useState("closed");
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const toggleRef = useRef(null);
  const panelTimerRef = useRef(null);
  const panelAnimFrameRef = useRef(null);

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
        const menuBody = menuElement.querySelector(".retro-menu__body");
        const menuList = menuElement.querySelector(".retro-menu__list");

        // DIAGNOSTIC: Log menu state and positioning
        console.log("🔍 [RetroMenu Debug] Panel Opening:", {
          panelState,
          dataPanelActive: menuElement.getAttribute("data-panel-active"),
          menuRect: {
            top: menuRect.top,
            left: menuRect.left,
            width: menuRect.width,
            height: menuRect.height,
          },
          menuContainerOpacity: window.getComputedStyle(menuElement).opacity,
          menuContainerBackground:
            window.getComputedStyle(menuElement).background.substring(0, 100) +
            "...",
          menuBodyOpacity: menuBody
            ? window.getComputedStyle(menuBody).opacity
            : "N/A",
          menuListOpacity: menuList
            ? window.getComputedStyle(menuList).opacity
            : "N/A",
          menuBodyDisplay: menuBody
            ? window.getComputedStyle(menuBody).display
            : "N/A",
        });

        // Calculate top position to overlay the menu body area
        // Position panel to replace the menu navbar area
        let topPos = menuRect.top;
        if (titlebar) {
          const titlebarRect = titlebar.getBoundingClientRect();
          // Align panel with the menu top for cleaner overlay
          topPos = menuRect.top; // Align with menu top

          console.log("🔍 [RetroMenu Debug] Titlebar:", {
            titlebarBottom: titlebarRect.bottom,
            calculatedTopPos: topPos,
          });
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

        console.log("🔍 [RetroMenu Debug] Final Panel Position:", newPosition);

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
    console.log("🔍 [RetroMenu Debug] openPanel called");

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
    console.log(
      "🔍 [RetroMenu Debug] Panel state set to 'fading' - menu starts fade"
    );
    
    // Monitor transform changes during transition
    if (toggleRef.current) {
      const menuElement = toggleRef.current.closest(".retro-menu");
      if (menuElement) {
        let frameCount = 0;
        const monitorTransform = () => {
          if (frameCount < 20) { // Monitor for ~300ms
            const styles = window.getComputedStyle(menuElement);
            console.log(`🎯 [Transform Monitor] Frame ${frameCount}:`, {
              transform: styles.transform,
              opacity: styles.opacity,
            });
            frameCount++;
            requestAnimationFrame(monitorTransform);
          }
        };
        requestAnimationFrame(monitorTransform);
      }
    }

    if (prefersReducedMotion.current) {
      // No delay for reduced motion
      setPanelState("opening");
    } else {
      // Delay panel appearance to allow menu opacity to decrease
      panelTimerRef.current = setTimeout(() => {
        setPanelState("opening");
        console.log(
          "🔍 [RetroMenu Debug] Panel state set to 'opening' (menu has faded)"
        );
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
    
    // DEBUG: Log computed styles when toggling
    if (toggleRef.current) {
      const menuElement = toggleRef.current.closest(".retro-menu");
      if (menuElement) {
        const computedStyles = window.getComputedStyle(menuElement);
        console.log("🎯 [Menu Toggle] Current styles:", {
          transform: computedStyles.transform,
          transformOrigin: computedStyles.transformOrigin,
          opacity: computedStyles.opacity,
          filter: computedStyles.filter,
          transition: computedStyles.transition,
          classList: menuElement.className,
          dataPanelActive: menuElement.getAttribute("data-panel-active"),
        });
        
        // Check for any inline styles
        console.log("🎯 [Menu Toggle] Inline styles:", {
          style: menuElement.style.cssText || "none",
        });
        
        // Check parent container
        const overlay = menuElement.closest(".menu-overlay");
        if (overlay) {
          const overlayStyles = window.getComputedStyle(overlay);
          console.log("🎯 [Menu Toggle] Parent overlay styles:", {
            transform: overlayStyles.transform,
            display: overlayStyles.display,
            justifyContent: overlayStyles.justifyContent,
            alignItems: overlayStyles.alignItems,
          });
        }
      }
    }
    
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (panelTimerRef.current) {
        clearTimeout(panelTimerRef.current);
      }
      if (panelAnimFrameRef.current) {
        cancelAnimationFrame(panelAnimFrameRef.current);
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
      ref={(node) => {
        if (node) {
          const isPanelActive =
            panelState === "fading" ||
            panelState === "opening" ||
            panelState === "open";
          console.log("🔍 [RetroMenu Debug] Nav render:", {
            panelState,
            dataPanelActive: isPanelActive,
            actualAttribute: node.getAttribute("data-panel-active"),
          });

          // Check if CSS is actually applying opacity
          if (isPanelActive) {
            setTimeout(() => {
              const menuBody = node.querySelector(".retro-menu__body");
              const menuList = node.querySelector(".retro-menu__list");
              const menuStatus = node.querySelector(".retro-menu__status");

              // Check ALL elements including the container itself
              console.log("🔍 [RetroMenu Debug] FULL opacity check:", {
                panelState,
                containerOpacity: window.getComputedStyle(node).opacity,
                containerBackground: window.getComputedStyle(node).background,
                containerDisplay: window.getComputedStyle(node).display,
                bodyOpacity: menuBody
                  ? window.getComputedStyle(menuBody).opacity
                  : "N/A",
                listOpacity: menuList
                  ? window.getComputedStyle(menuList).opacity
                  : "N/A",
                statusOpacity: menuStatus
                  ? window.getComputedStyle(menuStatus).opacity
                  : "N/A",
                containerRect: node.getBoundingClientRect(),
              });

              // Check what's actually visible
              const rect = node.getBoundingClientRect();
              console.log("🔍 [RetroMenu Debug] Container visibility:", {
                isVisible: rect.width > 0 && rect.height > 0,
                dimensions: `${rect.width}x${rect.height}`,
                position: `(${rect.left}, ${rect.top})`,
              });
            }, 100); // Check after CSS should have started transitioning
          }
        }
      }}
      data-effect-active={hasActiveEffect ? "true" : "false"}
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
            className={`retro-menu__settings-toggle${
              panelState === "opening" || panelState === "open"
                ? " is-active"
                : ""
            }`}
            onClick={togglePanel}
            aria-expanded={panelState === "opening" || panelState === "open"}
            aria-label="Toggle field effects settings"
            title="Field Effects"
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
          <button
            type="button"
            className="retro-menu__dismiss"
            onClick={handleDismiss}
          >
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
              onStatusChange({
                ...item.status,
                mode: isActive ? "active" : "preview",
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
              <span>Field Effects</span>
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
                title="Reset to default state"
              >
                <span>Zen</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("jitter");
                  closePanel();
                }}
                title="Trigger rapid ripple bursts"
              >
                <span>Jitter</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("swirlPulse");
                  closePanel();
                }}
                title="Enhance swirl motion"
              >
                <span>Swirl</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("spiralFlow");
                  closePanel();
                }}
                title="Unfurl logarithmic spiral currents"
              >
                <span>Spiral</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("riverFlow");
                  closePanel();
                }}
                title="Seismic waves ripple through the field"
              >
                <span>Quake</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("mandelbrotZoom");
                  closePanel();
                }}
                title="Dive through a Julia set zoom"
              >
                <span>Hop</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("reactionDiffusionBloom");
                  closePanel();
                }}
                title="Grow Gray-Scott bloom patterns"
              >
                <span>Bloom</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("harmonicPendulum");
                  closePanel();
                }}
                title="Trace chaotic harmonic pendulums"
              >
                <span>Blink</span>
              </button>
              <button
                type="button"
                className="retro-menu__effect-btn"
                onClick={() => {
                  onFieldEffect("starfield");
                  closePanel();
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
