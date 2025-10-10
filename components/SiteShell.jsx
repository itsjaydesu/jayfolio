"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import RetroMenu from "./RetroMenu";
import { SITE_TEXT_DEFAULTS } from "../lib/siteTextDefaults";
import SceneCanvas from "./SceneCanvas";

const DEFAULT_MENU_ITEMS = SITE_TEXT_DEFAULTS.primaryMenu.map((i) => ({
  id: i.id,
  label: i.label,
  href: i.route,
  status: { title: i.label, description: i.description },
}));

const DEFAULT_STATUS = {
  title: "Hello",
  description: "Please select a channel that interests you",
  mode: "waiting for your selection",
};

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [brand, setBrand] = useState(SITE_TEXT_DEFAULTS.brand);
  const [menuItems, setMenuItems] = useState(DEFAULT_MENU_ITEMS);
  const [isReturningHome, setIsReturningHome] = useState(false);
  const returnTimerRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const sceneRef = useRef(null);
  // Initialize animation state based on initial route
  const [animationState, setAnimationState] = useState(() => {
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const segment = segments[0] ?? null;
    const shouldStop = segment === 'about' || segment === 'projects' || 
                       segment === 'words' || segment === 'sounds';
    return shouldStop ? 'stopped' : 'normal';
  });
  const animationSpeedRef = useRef((() => {
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const segment = segments[0] ?? null;
    const shouldStop = segment === 'about' || segment === 'projects' || 
                       segment === 'words' || segment === 'sounds';
    return shouldStop ? 0 : 1.1;
  })());
  const targetSpeedRef = useRef((() => {
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const segment = segments[0] ?? null;
    const shouldStop = segment === 'about' || segment === 'projects' || 
                       segment === 'words' || segment === 'sounds';
    return shouldStop ? 0 : 1.1;
  })());

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/site-text", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load site text");
        if (ignore) return;
        const items = (data.primaryMenu || []).map((i) => ({
          id: i.id,
          label: i.label,
          href: i.route,
          status: { title: i.label, description: i.description },
        }));
        setBrand(data.brand || SITE_TEXT_DEFAULTS.brand);
        setMenuItems(items.length ? items : DEFAULT_MENU_ITEMS);
      } catch (e) {
        void e; // fallback silently
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const pathSegments = useMemo(
    () => pathname?.split("/").filter(Boolean) ?? [],
    [pathname]
  );
  const primarySegment = pathSegments[0] ?? null;
  const activeItem = useMemo(
    () => menuItems.find((item) => item.id === primarySegment) ?? null,
    [primarySegment, menuItems]
  );
  const activeSection = activeItem?.id ?? null;
  const isDetailView = pathSegments.length > 1 && Boolean(activeItem);
  const isAdminView = primarySegment === "admin";
  const isHome = pathSegments.length === 0;
  
  // Check if we're on a route that should stop animation
  const shouldStopAnimation = primarySegment === 'about' || 
                              primarySegment === 'projects' || 
                              primarySegment === 'words' || 
                              primarySegment === 'sounds';

  const activeStatus = useMemo(
    () =>
      activeItem ? { ...activeItem.status, mode: "active" } : DEFAULT_STATUS,
    [activeItem]
  );
  const [status, setStatus] = useState(activeStatus);
  const [navReady, setNavReady] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasActiveEffect, setHasActiveEffect] = useState(false);

  useEffect(() => {
    router.prefetch("/");
    return () => {
      if (returnTimerRef.current) {
        window.clearTimeout(returnTimerRef.current);
        returnTimerRef.current = null;
      }
    };
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (motionQuery.matches) {
      setNavReady(true);
      return;
    }

    let frameId = requestAnimationFrame(() => {
      setNavReady(true);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    setStatus(activeStatus);
  }, [activeStatus]);

  useEffect(() => {
    if (!isHome) {
      setMenuVisible(false);
      return;
    }

    if (typeof window === "undefined") {
      setMenuVisible(true);
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      setMenuVisible(true);
      return;
    }

    let frameId = requestAnimationFrame(() => {
      setMenuVisible(true);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isHome]);

  useEffect(() => {
    if (isDetailView || typeof window === "undefined") {
      setHasScrolled(false);
      return;
    }

    const SCROLL_TRIGGER_PX = 12;
    const handleScroll = () => {
      const next = window.scrollY > SCROLL_TRIGGER_PX;
      setHasScrolled((prev) => (prev === next ? prev : next));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isDetailView, pathname]);
  
  // Track fade state for dots
  const [dotsFaded, setDotsFaded] = useState(shouldStopAnimation);
  const fadeTimeoutRef = useRef(null);
  
  // Initialize animation settings on mount if on a stopped route
  useEffect(() => {
    // Use multiple retry attempts to ensure SceneCanvas is fully initialized
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 50; // 50ms between retries
    
    const applyInitialSettings = () => {
      if (!sceneRef.current) {
        // Retry if SceneCanvas isn't ready yet
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(applyInitialSettings, retryDelay);
        }
        return;
      }
      
      if (shouldStopAnimation) {
        // Immediately set all animation values to 0 and fade dots on mount
        sceneRef.current.applySettings({
          animationSpeed: 0,
          amplitude: 0,
          swirlStrength: 0,
          waveXFrequency: 0,
          waveYFrequency: 0,
          swirlFrequency: 0,
          mouseInfluence: 0,
          rippleStrength: 0,
          brightness: 0,  // Fade dots to black
          opacity: 0      // Make dots transparent
        }, true);
        setDotsFaded(true);
        setAnimationState('stopped');
        animationSpeedRef.current = 0;
        targetSpeedRef.current = 0;
      }
    };
    
    // Start applying settings with a small initial delay
    const initTimer = setTimeout(applyInitialSettings, 20);
    
    return () => clearTimeout(initTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount
  
  // Handle animation state changes based on route
  useEffect(() => {
    if (!sceneRef.current) return;
    
    let animationFrame;
    let startTime;
    const TRANSITION_DURATION = 2000; // 2 seconds for smooth transition
    
    const easeInOutCubic = (t) => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    // Store original animation values for restoration
    const animationSettings = shouldStopAnimation ? {
      // When stopping, set all animation-related values to 0/minimal
      animationSpeed: 0,
      amplitude: 0,
      swirlStrength: 0,
      waveXFrequency: 0,
      waveYFrequency: 0,
      swirlFrequency: 0,
      mouseInfluence: 0,
      rippleStrength: 0,
      brightness: 0,     // Fade dots to black
      opacity: 0         // Make dots transparent
    } : {
      // Default animation values when resuming
      animationSpeed: 1.1,
      amplitude: 32,
      swirlStrength: 0.8,
      waveXFrequency: 0.025,
      waveYFrequency: 0.018,
      swirlFrequency: 0.0035,
      mouseInfluence: 0.012,
      rippleStrength: 24,
      brightness: 0.35,  // Default brightness
      opacity: 0.85      // Default opacity
    };
    
    // Store initial values for smoother interpolation
    const getInitialValues = () => {
      const current = {};
      for (const key of Object.keys(animationSettings)) {
        if (key === 'animationSpeed') {
          current[key] = animationSpeedRef.current;
        } else {
          // For other values, use the opposite of target as initial
          current[key] = shouldStopAnimation ? 
            (animationSettings[key] === 0 ? (key === 'opacity' ? 0.85 : key === 'brightness' ? 0.35 : 1) : 0) :
            animationSettings[key];
        }
      }
      return current;
    };
    
    const initialValues = getInitialValues();
    
    const updateAnimationState = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / TRANSITION_DURATION, 1);
      const easedProgress = easeInOutCubic(progress);
      
      // Apply all animation settings with easing
      const currentSettings = {};
      for (const [key, targetValue] of Object.entries(animationSettings)) {
        const initialValue = initialValues[key];
        currentSettings[key] = initialValue + (targetValue - initialValue) * easedProgress;
        if (key === 'animationSpeed') {
          animationSpeedRef.current = currentSettings[key];
        }
      }
      
      // Apply the interpolated settings
      if (sceneRef.current) {
        sceneRef.current.applySettings(currentSettings, true);
      }
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateAnimationState);
      } else {
        // Transition complete
        if (animationState === 'slowing') {
          setAnimationState('stopped');
        } else if (animationState === 'resuming') {
          setAnimationState('normal');
        }
      }
    };
    
    // Store fadeTimeout in a variable for cleanup
    const currentFadeTimeout = fadeTimeoutRef.current;
    
    if (shouldStopAnimation && animationState === 'normal') {
      // Start slowing down to stop and fade to black
      setAnimationState('slowing');
      targetSpeedRef.current = 0;
      animationFrame = requestAnimationFrame(updateAnimationState);
      
      // Start fade to black immediately (CSS handles the 1.5s transition)
      if (currentFadeTimeout) clearTimeout(currentFadeTimeout);
      setDotsFaded(true);
    } else if (!shouldStopAnimation && animationState === 'stopped') {
      // Start resuming to normal speed and fade in
      setAnimationState('resuming');
      targetSpeedRef.current = 1.1;
      animationSpeedRef.current = 0; // Start from 0 when resuming
      
      // Fade dots back in immediately for smooth transition
      setDotsFaded(false);
      if (currentFadeTimeout) clearTimeout(currentFadeTimeout);
      
      // Start the animation immediately
      animationFrame = requestAnimationFrame(updateAnimationState);
    } else if (!shouldStopAnimation && animationState === 'slowing') {
      // Interrupted while slowing, resume immediately
      setAnimationState('resuming');
      targetSpeedRef.current = 1.1;
      
      // Clear fade state immediately since we're interrupting
      setDotsFaded(false);
      if (currentFadeTimeout) clearTimeout(currentFadeTimeout);
      
      // Restart animation with current values
      startTime = null; // Reset start time for new animation
      animationFrame = requestAnimationFrame(updateAnimationState);
    } else if (shouldStopAnimation && animationState === 'resuming') {
      // Interrupted while resuming, start slowing again
      setAnimationState('slowing');
      targetSpeedRef.current = 0;
      
      // Start fade to black
      setDotsFaded(true);
      if (currentFadeTimeout) clearTimeout(currentFadeTimeout);
      
      // Restart animation with current values
      startTime = null; // Reset start time for new animation
      animationFrame = requestAnimationFrame(updateAnimationState);
    } else if (shouldStopAnimation && animationState === 'stopped') {
      // Already stopped, ensure animation values are at 0 and dots are faded
      if (sceneRef.current) {
        sceneRef.current.applySettings({
          animationSpeed: 0,
          amplitude: 0,
          swirlStrength: 0,
          waveXFrequency: 0,
          waveYFrequency: 0,
          swirlFrequency: 0,
          mouseInfluence: 0,
          rippleStrength: 0,
          brightness: 0,
          opacity: 0
        }, true);
      }
      setDotsFaded(true);
    } else if (!shouldStopAnimation && animationState === 'normal') {
      // On home page with normal animation - ensure dots are visible
      if (dotsFaded) {
        setDotsFaded(false);
      }
    } else if (!shouldStopAnimation && animationState === 'resuming') {
      // Currently resuming - ensure fade is cleared
      if (dotsFaded) {
        setDotsFaded(false);
      }
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (currentFadeTimeout) {
        clearTimeout(currentFadeTimeout);
      }
    };
  }, [shouldStopAnimation, animationState, dotsFaded]);

  useEffect(() => {
    if (!isHome) return;
    if (returnTimerRef.current) {
      window.clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }
    setIsReturningHome(false);
  }, [isHome]);

  const handleStatusChange = (next) => {
    if (!next) return;
    setStatus(next);
  };

  const handleMenuReset = () => {
    setStatus(activeStatus);
  };

  const handlePreview = (item, isActive) => {
    if (!item) return;
    setStatus({ ...item.status, mode: isActive ? "active" : "preview" });
  };

  const handleReset = () => {
    setStatus(activeStatus);
  };

  const handleEffectChange = useCallback((isActive) => {
    setHasActiveEffect(isActive);
  }, []);

  const handleFieldEffect = (effectType) => {
    if (!sceneRef.current) return;
    
    switch (effectType) {
      case 'jitter':
        // Create a jittery ripple cascade with layered splashes
        // Main drop
        sceneRef.current.addRipple(0, 0, 3);
        
        // First bounce - smaller ripples in a circle
        setTimeout(() => {
          const angleStep = (Math.PI * 2) / 6;
          for (let i = 0; i < 6; i++) {
            const angle = i * angleStep;
            const x = Math.cos(angle) * 800;
            const z = Math.sin(angle) * 800;
            sceneRef.current.addRipple(x, z, 1.5);
          }
        }, 200);
        
        // Second bounce - even smaller, wider circle
        setTimeout(() => {
          const angleStep = (Math.PI * 2) / 8;
          for (let i = 0; i < 8; i++) {
            const angle = i * angleStep + Math.PI / 8; // Offset for variety
            const x = Math.cos(angle) * 1400;
            const z = Math.sin(angle) * 1400;
            sceneRef.current.addRipple(x, z, 0.8);
          }
        }, 400);
        
        // Final splash - random drops
        setTimeout(() => {
          for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 600 + Math.random() * 1000;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            sceneRef.current.addRipple(x, z, 0.5 + Math.random() * 0.5);
          }
        }, 600);
        // Jitter doesn't need transparent menu
        break;
      case 'spiralFlow':
      case 'riverFlow':
      case 'mandelbrotZoom':
      case 'reactionDiffusionBloom':
      case 'harmonicPendulum':
      case 'starfield':
        if (!sceneRef.current.triggerEffect(effectType)) {
          console.warn(`[SiteShell] Failed to trigger effect "${effectType}"`);
        }
        break;
      case 'swirlPulse':
        // Enhance swirl effect with smooth transitions
        sceneRef.current.applySettings({
          swirlStrength: 2.5,
          swirlFrequency: 0.008,
          animationSpeed: 1.8,
          amplitude: 60
        });
        // Swirl pulse is an active effect
        setHasActiveEffect(true);
        break;
      case 'calmReset':
        // Reset to default calm state
        sceneRef.current.resetToDefaults();
        setHasActiveEffect(false);
        break;
    }
  };

  const handleNavigateHome = (event) => {
    if (isHome || isReturningHome) return;
    if (event) {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        ("button" in event && event.button !== 0)
      ) {
        return;
      }
      event.preventDefault();
    }

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      router.push("/");
      return;
    }

    setIsReturningHome(true);
    if (returnTimerRef.current) {
      window.clearTimeout(returnTimerRef.current);
    }

    returnTimerRef.current = window.setTimeout(() => {
      router.push("/");
    }, 520);
  };

  if (isAdminView) {
    return (
      <div className="site-shell site-shell--plain">
        <div className="admin-stage">{children}</div>
      </div>
    );
  }

  const activeSectionForCanvas = activeSection ?? "about";
  const showCanvas = !isDetailView;

  if (isHome) {
    return (
      <>
        <div className="scene-wrapper">
          <SceneCanvas 
            activeSection={activeSectionForCanvas} 
            isPaused={false}
            onEffectChange={handleEffectChange}
            ref={sceneRef}
          />
        </div>
        <div className={`menu-overlay${menuVisible ? " is-visible" : ""}`}>
          <RetroMenu
            id="retro-menu"
            items={menuItems}
            activeSection={activeSection}
            status={status}
            activeStatus={activeStatus}
            onStatusChange={handleStatusChange}
            onNavigate={handleMenuReset}
            onFieldEffect={handleFieldEffect}
            hasActiveEffect={hasActiveEffect}
            isOpen
            variant="centerpiece"
          />
        </div>
      </>
    );
  }

  return (
    <>
      {showCanvas ? (
        <div className={`scene-wrapper${dotsFaded ? " scene-wrapper--faded" : ""}${shouldStopAnimation ? " scene-wrapper--black" : ""}`}>
          <SceneCanvas 
            activeSection={activeSectionForCanvas} 
            isPaused={shouldStopAnimation}
            onEffectChange={handleEffectChange}
            ref={sceneRef}
          />
        </div>
      ) : null}
      <div className={`site-shell${isDetailView ? " site-shell--detail" : ""}`}>
        <div className="site-shell__container">
          {!isDetailView ? (
            <header
              className={`site-shell__header${
                hasScrolled ? " site-shell__header--shaded" : ""
              }`}
              data-nav-ready={navReady ? "true" : "false"}
              data-returning-home={isReturningHome ? "true" : "false"}
              style={
                navReady
                  ? undefined
                  : {
                      opacity: "var(--nav-initial-opacity, 0)",
                      transform:
                        "translate(-50%, var(--nav-initial-offset, -18px))",
                    }
              }
            >
              <Link
                href="/"
                className="site-shell__brand"
                onClick={handleNavigateHome}
                style={
                  navReady
                    ? undefined
                    : {
                        opacity: "var(--nav-item-initial-opacity, 0)",
                        transform:
                          "translateY(var(--nav-item-initial-offset, 8px))",
                      }
                }
              >
                {brand}
              </Link>
              <nav className="site-shell__nav" aria-label="Primary navigation">
                {menuItems.map((item, index) => {
                  const isActive = item.id === activeSection;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      prefetch
                      className={`site-shell__nav-link${
                        isActive ? " is-active" : ""
                      }`}
                      aria-current={isActive ? "page" : undefined}
                      onMouseEnter={() => handlePreview(item, isActive)}
                      onMouseLeave={handleReset}
                      onFocus={() => handlePreview(item, isActive)}
                      onBlur={handleReset}
                      style={
                        navReady
                          ? {
                              transitionDelay: `${index * 60}ms`,
                            }
                          : {
                              opacity: "var(--nav-item-initial-opacity, 0)",
                              transform:
                                "translateY(var(--nav-item-initial-offset, 12px))",
                            }
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <Link
                href="https://x.com/itsjaydesu"
                className="site-shell__social"
                target="_blank"
                rel="noreferrer noopener"
                style={
                  navReady
                    ? undefined
                    : {
                        opacity: "var(--nav-item-initial-opacity, 0)",
                        transform:
                          "translateY(var(--nav-item-initial-offset, 8px))",
                      }
                }
              >
                @itsjaydesu
              </Link>
            </header>
          ) : null}
          <p className="sr-only" aria-live="polite">
            {status.title}: {status.description}
          </p>
          <main
            key={pathname}
            className={`site-shell__main${
              isDetailView ? " is-detail" : " site-shell__transition"
            }${isReturningHome ? " is-fading-out" : ""}`}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
