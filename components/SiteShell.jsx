"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import RetroMenu from "./RetroMenu";
import { SITE_TEXT_DEFAULTS } from "../lib/siteTextDefaults";
import SceneCanvas from "./SceneCanvas";
import { useAdminStatus } from "../lib/useAdminStatus";

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

export default function SiteShell({ children, isAdmin = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const sceneRef = useRef(null);
  const returnTimerRef = useRef(null);
  const menuLeaveTimerRef = useRef(null); // Timer for menu fade-out animation
  const headerLeaveTimerRef = useRef(null); // Timer for header fade-out animation
  const { isAdmin: clientAdmin } = useAdminStatus();
  const isAdminActive = isAdmin || clientAdmin;
  
  // ===== ROUTE ANALYSIS =====
  const pathSegments = useMemo(
    () => pathname?.split("/").filter(Boolean) ?? [],
    [pathname]
  );
  const primarySegment = pathSegments[0] ?? null;
  const isHome = pathSegments.length === 0;
  const isAdminView = primarySegment === "administratorrrr";
  
  // Check if current route should stop animation
  const shouldStopAnimation = primarySegment === 'about' || 
                              primarySegment === 'projects' || 
                              primarySegment === 'words' || 
                              primarySegment === 'sounds' || 
                              primarySegment === 'art';
  const showAdminControls = isAdminActive && isHome;
  
  // ===== INITIAL STATE SETUP =====
  // Track if this is the initial mount (for instant black on subpages)
  const [isInitialMount, setIsInitialMount] = useState(true);
  
  // Animation state management
  const [animationState, setAnimationState] = useState(() => 
    shouldStopAnimation ? 'stopped' : 'normal'
  );
  
  // Animation speed refs
  const animationSpeedRef = useRef(shouldStopAnimation ? 0 : 1.1);
  const targetSpeedRef = useRef(shouldStopAnimation ? 0 : 1.1);
  
  // Visual state
  const [dotsFaded, setDotsFaded] = useState(shouldStopAnimation);
  const fadeTimeoutRef = useRef(null);
  
  // Navigation and UI state
  const [brand, setBrand] = useState(SITE_TEXT_DEFAULTS.brand);
  const [menuItems, setMenuItems] = useState(DEFAULT_MENU_ITEMS);
  const [isReturningHome, setIsReturningHome] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuLeaving, setMenuLeaving] = useState(false); // Track menu fade-out state
  // Initialize header visibility correctly based on route
  const [headerVisible, setHeaderVisible] = useState(() => !isHome); // Start visible on subpages, hidden on home
  const [headerLeaving, setHeaderLeaving] = useState(false); // Track header fade-out state
  const [status, setStatus] = useState(DEFAULT_STATUS);
  // Initialize navReady as true on subpages to prevent flash
  const [navReady, setNavReady] = useState(() => {
    // Start as ready if we're not on home and not server-side
    if (typeof window !== "undefined" && !isHome) {
      return true;
    }
    return false;
  });
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasActiveEffect, setHasActiveEffect] = useState(false);
  const [activeEffectInfo, setActiveEffectInfo] = useState(null); // { name, startTime, duration }

  // Active menu item computation
  const activeItem = useMemo(
    () => menuItems.find((item) => item.id === primarySegment) ?? null,
    [primarySegment, menuItems]
  );
  const activeSection = activeItem?.id ?? null;
  const isDetailView = pathSegments.length > 1 && Boolean(activeItem);

  const activeStatus = useMemo(
    () =>
      activeItem ? { ...activeItem.status, mode: "active" } : DEFAULT_STATUS,
    [activeItem]
  );
  
  // Update status when active item changes
  useEffect(() => {
    setStatus(activeStatus);
  }, [activeStatus]);

  // ===== DATA FETCHING =====
  // Load site text and menu items
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
  
  // ===== ROUTER SETUP =====
  // Prefetch home route and cleanup
  useEffect(() => {
    router.prefetch("/");
    return () => {
      if (returnTimerRef.current) {
        window.clearTimeout(returnTimerRef.current);
        returnTimerRef.current = null;
      }
      if (menuLeaveTimerRef.current) {
        window.clearTimeout(menuLeaveTimerRef.current);
        menuLeaveTimerRef.current = null;
      }
      if (headerLeaveTimerRef.current) {
        window.clearTimeout(headerLeaveTimerRef.current);
        headerLeaveTimerRef.current = null;
      }
    };
  }, [router]);

  // Set nav ready state after component mounts
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // If already ready (on subpage), keep it ready
    if (navReady) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (motionQuery.matches) {
      setNavReady(true);
      return;
    }

    // Small delay to ensure smooth initial render
    const timer = setTimeout(() => {
      setNavReady(true);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []); // Run once on mount

  useEffect(() => {
    // Clear any pending menu leave timer when component unmounts or dependencies change
    const clearMenuLeaveTimer = () => {
      if (menuLeaveTimerRef.current) {
        clearTimeout(menuLeaveTimerRef.current);
        menuLeaveTimerRef.current = null;
      }
    };

    if (!isHome) {
      // Navigating away from home - start fade-out animation
      if (menuVisible && !menuLeaving) {
        setMenuLeaving(true); // Start fade-out animation
        
        // Check for reduced motion preference
        const motionQuery = typeof window !== "undefined" && 
          window.matchMedia("(prefers-reduced-motion: reduce)");
        
        if (motionQuery && motionQuery.matches) {
          // No animation for reduced motion
          setMenuVisible(false);
          setMenuLeaving(false);
        } else {
          // Allow time for fade-out animation (0.68s matches the CSS transition)
          menuLeaveTimerRef.current = setTimeout(() => {
            setMenuVisible(false);
            setMenuLeaving(false);
            menuLeaveTimerRef.current = null;
          }, 680); // 680ms to match the menu fade-out transition duration
        }
      }
      return clearMenuLeaveTimer;
    }

    // Navigating to home - show menu
    clearMenuLeaveTimer(); // Clear any pending hide timer
    setMenuLeaving(false); // Clear leaving state

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
      clearMenuLeaveTimer();
    };
  }, [isHome, menuVisible, menuLeaving]);

  // Handle header visibility and transitions
  useEffect(() => {
    // Skip if we're in SSR
    if (typeof window === "undefined") return;
    
    // Clear any pending header leave timer
    const clearHeaderLeaveTimer = () => {
      if (headerLeaveTimerRef.current) {
        clearTimeout(headerLeaveTimerRef.current);
        headerLeaveTimerRef.current = null;
      }
    };

    // Check for reduced motion preference once
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (isHome) {
      // Navigating to home - header should fade out smoothly
      if (headerVisible) {
        if (prefersReducedMotion) {
          // Instant hide for reduced motion
          setHeaderVisible(false);
          setHeaderLeaving(false);
        } else if (!headerLeaving) {
          // Start graceful fade-out animation
          setHeaderLeaving(true);
          
          // Wait for the full animation to complete
          // Container: 0.1s delay + 0.8s animation = 0.9s
          // Last child (brand): 0.3s delay + 0.6s animation = 0.9s
          // Add small buffer for safety = 950ms total
          headerLeaveTimerRef.current = setTimeout(() => {
            setHeaderVisible(false);
            setHeaderLeaving(false);
            headerLeaveTimerRef.current = null;
          }, 950);
        }
      }
    } else {
      // Not on home page - show header
      clearHeaderLeaveTimer();
      
      if (!headerVisible) {
        if (prefersReducedMotion) {
          // Instant show for reduced motion
          setHeaderVisible(true);
          setHeaderLeaving(false);
        } else {
          // Reset leaving state first, then show after a micro delay for smoother entrance
          setHeaderLeaving(false);
          // Use a small delay to ensure DOM is ready and prevent flash
          const showTimer = setTimeout(() => {
            setHeaderVisible(true);
          }, 50);
          
          return () => {
            clearTimeout(showTimer);
            clearHeaderLeaveTimer();
          };
        }
      } else if (headerLeaving) {
        // If we were in the middle of leaving but route changed, cancel it
        clearHeaderLeaveTimer();
        setHeaderLeaving(false);
      }
    }

    return clearHeaderLeaveTimer;
  }, [isHome]); // Simplified dependencies - only care about route change

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
  
  // ===== MOUNT INITIALIZATION =====
  // Initialize scene on mount for stopped routes (instant black on subpages)
  useEffect(() => {
    if (!shouldStopAnimation || !isInitialMount) return;
    
    const initializeStoppedScene = () => {
      if (!sceneRef.current) {
        // Retry if scene isn't ready (max 5 attempts)
        if (initializeStoppedScene.retryCount < 5) {
          initializeStoppedScene.retryCount++;
          setTimeout(initializeStoppedScene, 50);
        }
        return;
      }
      
      // Apply stopped state immediately (no animations)
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
      
      // Set visual states
      setDotsFaded(true);
      setAnimationState('stopped');
      animationSpeedRef.current = 0;
      targetSpeedRef.current = 0;
      setIsInitialMount(false);
    };
    
    initializeStoppedScene.retryCount = 0;
    const timer = setTimeout(initializeStoppedScene, 20);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount
  
  // Mark initial mount complete after first render
  useEffect(() => {
    setIsInitialMount(false);
  }, []);
  
  // Handle animation state changes based on route
  useEffect(() => {
    if (!sceneRef.current) return;
    
    let animationFrame;
    let startTime;
    // Different durations for fade-out vs fade-in for more interesting transitions
    const FADE_OUT_DURATION = 3000; // 3 seconds for slow, interesting fade-out
    const FADE_IN_DURATION = 2000; // 2 seconds for fade-in
    const TRANSITION_DURATION = shouldStopAnimation ? FADE_OUT_DURATION : FADE_IN_DURATION;
    
    // Custom easing for fade-out - more gradual at the beginning, then accelerates
    const easeOutQuint = (t) => {
      return 1 - Math.pow(1 - t, 5);
    };
    
    // Standard easing for fade-in
    const easeInOutCubic = (t) => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    // Store original animation values for restoration
    const animationSettings = shouldStopAnimation ? {
      // When stopping, gradually reduce values for more organic fade
      animationSpeed: 0.1,    // Slow down but don't completely stop initially
      amplitude: 2,           // Keep subtle movement during fade
      swirlStrength: 0.1,     // Minimal swirl
      waveXFrequency: 0.005,  // Very slow waves
      waveYFrequency: 0.003,  // Very slow waves
      swirlFrequency: 0.0005, // Minimal swirl frequency
      mouseInfluence: 0.001,  // Almost no mouse influence
      rippleStrength: 2,      // Minimal ripples
      brightness: 0,          // Fade dots to black
      opacity: 0              // Make dots transparent
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
      // Use different easing for fade-out vs fade-in
      const easedProgress = shouldStopAnimation ? 
        easeOutQuint(progress) : 
        easeInOutCubic(progress);
      
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
      
      // Start fade to black immediately (CSS handles the transition)
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
      // Already stopped, ensure animation values are fully at 0 and dots are faded
      if (sceneRef.current) {
        sceneRef.current.applySettings({
          animationSpeed: 0,      // Fully stopped
          amplitude: 0,           // No movement
          swirlStrength: 0,       // No swirl
          waveXFrequency: 0,      // No waves
          waveYFrequency: 0,      // No waves
          swirlFrequency: 0,      // No swirl
          mouseInfluence: 0,      // No mouse influence
          rippleStrength: 0,      // No ripples
          brightness: 0,          // Black dots
          opacity: 0              // Fully transparent
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

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene?.setControlsVisible) return;
    scene.setControlsVisible(showAdminControls);
  }, [showAdminControls]);

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

  const handleSceneAttach = useCallback(
    (instance) => {
      sceneRef.current = instance;
      if (instance?.setControlsVisible) {
        instance.setControlsVisible(showAdminControls);
      }
    },
    [showAdminControls]
  );

  const handleEffectChange = useCallback((isActive, effectType) => {
    setHasActiveEffect(isActive);
    if (isActive && effectType) {
      // All effects standardized to 15 seconds, except jitter which is 3 seconds
      const effectDurations = {
        spiralFlow: 15,
        riverFlow: 15,  // Quake
        mandelbrotZoom: 15,
        reactionDiffusionBloom: 15,
        harmonicPendulum: 15,
        starfield: 15,
        zenMode: 15,
        jitter: 3,  // Shorter duration for jitter
      };
      
      const effectNames = {
        spiralFlow: 'Spiral',
        riverFlow: 'Quake',
        mandelbrotZoom: 'Hop',
        reactionDiffusionBloom: 'Bloom',
        harmonicPendulum: 'Blink',
        starfield: 'Stars',
        zenMode: 'Zen',
        jitter: 'Jitter',
      };
      
      setActiveEffectInfo({
        name: effectNames[effectType] || effectType,
        type: effectType,
        startTime: Date.now(),
        duration: effectDurations[effectType] || null
      });
    } else {
      setActiveEffectInfo(null);
    }
  }, []);

  const handleFieldEffect = (effectType) => {
    if (!sceneRef.current) return;
    
    switch (effectType) {
      case 'jitter':
        // Activate the jitter effect with smooth easing
        sceneRef.current.triggerEffect('jitter');
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
        // Swirl pulse is a temporary active effect
        setHasActiveEffect(true);
        setActiveEffectInfo({
          name: 'Swirl',
          type: 'swirlPulse',
          startTime: Date.now(),
          duration: 15  // Standardized duration
        });
        // Auto-reset after 15 seconds
        setTimeout(() => {
          sceneRef.current.resetToDefaults();
          setHasActiveEffect(false);
          setActiveEffectInfo(null);
        }, 15000);
        break;
      case 'calmReset':
        // If an effect is active, reset to defaults
        // If no effect is active, trigger the zen mode for ultra-calm state
        if (hasActiveEffect) {
          sceneRef.current.resetToDefaults();
          setHasActiveEffect(false);
          setActiveEffectInfo(null);
        } else {
          // Trigger zen mode for a very flat, calm sea
          if (sceneRef.current.triggerEffect('zenMode')) {
            setHasActiveEffect(true);
            setActiveEffectInfo({
              name: 'Zen',
              type: 'zenMode',
              startTime: Date.now(),
              duration: null  // Zen mode has no duration
            });
          }
        }
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
            isHomeScene
            showControls={showAdminControls}
            ref={handleSceneAttach}
          />
        </div>
        <div className={`menu-overlay${menuVisible ? " is-visible" : ""}${menuLeaving ? " is-leaving" : ""}`}>
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
            activeEffectInfo={activeEffectInfo}
            isOpen
            variant="centerpiece"
          />
        </div>
      </>
    );
  }

  // Log CSS class application
  // Key insight: The scene-wrapper--black class should be applied:
  // 1. Immediately on initial mount if on a sub-page
  // 2. With the dots fade during navigation (both together)
  // The issue is that both classes together trigger transition: none
  // Solution: Only add scene-wrapper--black if we're in the 'stopped' state or initial mount
  const shouldApplyBlackBg = (shouldStopAnimation && animationState === 'stopped') || 
                              (isInitialMount && shouldStopAnimation);
  const sceneWrapperClasses = `scene-wrapper${dotsFaded ? " scene-wrapper--faded" : ""}${shouldApplyBlackBg ? " scene-wrapper--black" : ""}`;

  return (
    <>
      {showCanvas ? (
        <div 
          className={sceneWrapperClasses}
          data-initial-mount={isInitialMount}
        >
          <SceneCanvas 
            activeSection={activeSectionForCanvas} 
            isPaused={shouldStopAnimation}
            onEffectChange={handleEffectChange}
            isHomeScene={false}
            showControls={false}
            ref={handleSceneAttach}
          />
        </div>
      ) : null}
      <div className={`site-shell${isDetailView ? " site-shell--detail" : ""}`}>
        <div className="site-shell__container">
          {!isDetailView && headerVisible ? (
            <header
              className={`site-shell__header${
                hasScrolled ? " site-shell__header--shaded" : ""
              }${headerLeaving ? " is-leaving" : ""}`}
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
