"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback, Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import RetroMenu from "./RetroMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import BrandWordmark from "./BrandWordmark";
import { DotfieldIcon, XLogoIcon } from "./icons";
import SiteFooter from "./SiteFooter";
import { SITE_TEXT_DEFAULTS } from "../lib/siteTextDefaults";
import { useAdminStatus } from "../lib/useAdminStatus";
import { useLanguage } from "../contexts/LanguageContext";
import { t, getLocalizedContent } from "../lib/translations";

const DOTFIELD_OVERLAY_FADE_MS = 520;
const DOTFIELD_EFFECT_SEQUENCE = [
  'calmReset',
  'jitter',
  'swirlPulse',
  'spiralFlow',
  'riverFlow',
  'mandelbrotZoom',
  'reactionDiffusionBloom',
  'harmonicPendulum',
  'starfield'
];

// Dynamically import SceneCanvas to reduce initial bundle size
const SceneCanvas = dynamic(() => import('./SceneCanvas'), {
  loading: () => <div className="canvas-placeholder" aria-label="Loading visualization" />,
  ssr: false // Disable SSR for Three.js component
});

// Helper function to get localized menu items
function getLocalizedMenuItems(lang = 'en') {
  return SITE_TEXT_DEFAULTS.primaryMenu.map((i) => ({
    id: i.id,
    label: t(`nav.${i.id}`, lang),
    href: i.route,
    status: { 
      title: t(`nav.${i.id}`, lang), 
      description: getLocalizedContent(i.description, lang) 
    },
  }));
}

// Helper function to get localized waiting status data
function getWaitingStatus(lang = 'en') {
  return {
    title: t('status.waiting', lang),
    description: t('status.waiting-desc', lang)
  };
}

function createStatusPayload(statusData, language = 'en', modeKey = 'waiting') {
  const safeStatus = statusData || {};
  const title = safeStatus.title ?? '';
  const description = safeStatus.description ?? '';
  const resolvedMode = modeKey ?? 'waiting';

  return {
    title,
    description,
    modeKey: resolvedMode,
    mode: t(`status.mode.${resolvedMode}`, language)
  };
}

export default function SiteShell({ children, isAdmin = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const sceneRef = useRef(null);
  const overlaySceneRef = useRef(null);
  const { language } = useLanguage();
  const returnTimerRef = useRef(null);
  const menuLeaveTimerRef = useRef(null); // Timer for menu fade-out animation
  const headerLeaveTimerRef = useRef(null); // Timer for header fade-out animation
  const headerLeavingRef = useRef(false); // Track leaving state with ref for immediate updates
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
                              primarySegment === 'content' || 
                              primarySegment === 'sounds' || 
                              primarySegment === 'art' ||
                              primarySegment === 'work-with-me';
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
  const [brand, setBrand] = useState(t('brand.name', language));
  const [menuItems, setMenuItems] = useState(getLocalizedMenuItems(language));
  const [isReturningHome, setIsReturningHome] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuLeaving, setMenuLeaving] = useState(false); // Track menu fade-out state
  // Initialize header visibility correctly based on route
  const [headerVisible, setHeaderVisible] = useState(() => !isHome); // Start visible on subpages, hidden on home
  const [headerLeaving, setHeaderLeaving] = useState(false); // Track header fade-out state
  // Track previous route to detect transitions - use state for immediate updates
  const [prevIsHome, setPrevIsHome] = useState(isHome);
  // Track if we're currently animating out - this persists through re-renders
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isDotfieldOverlayOpen, setIsDotfieldOverlayOpen] = useState(false);
  const [isDotfieldOverlayMounted, setIsDotfieldOverlayMounted] = useState(false);
  const [isDotfieldOverlayLeaving, setIsDotfieldOverlayLeaving] = useState(false);
  const [isDotfieldFieldPanelOpen, setIsDotfieldFieldPanelOpen] = useState(false);
  const overlayFadeTimeoutRef = useRef(null);
  const overlayAnimationFrameRef = useRef(null);
  const lastPathnameRef = useRef(pathname);
  
  // Compute if we should keep header mounted - check animation flag first
  const shouldKeepHeaderMounted = 
    !isHome || // Always show on subpages
    isAnimatingOut || // CRITICAL: Keep mounted during animation
    headerVisible || 
    headerLeaving || 
    headerLeavingRef.current;
  
  // Handle route changes - but DON'T update prevIsHome immediately if animating
  if (prevIsHome !== isHome && !isAnimatingOut) {
    // If transitioning to home with visible header, start animation sequence
    if (!prevIsHome && isHome && headerVisible) {
      headerLeavingRef.current = true;
      setIsAnimatingOut(true); // Set animation flag
      // DON'T update prevIsHome yet - wait for animation to complete
    } else {
      // For other transitions, update immediately
      setPrevIsHome(isHome);
      // Clear any lingering animation state
      if (isAnimatingOut) {
        setIsAnimatingOut(false);
      }
    }
  }
  const createStatus = useCallback(
    (statusData, modeKey = 'waiting') => createStatusPayload(statusData, language, modeKey),
    [language]
  );

  const waitingStatus = useMemo(
    () => createStatus(getWaitingStatus(language), 'waiting'),
    [createStatus, language]
  );

  const fieldEffectsLabel = useMemo(
    () => t('menu.field-effects', language),
    [language]
  );

  const overlayEffectLabels = useMemo(
    () => ({
      calmReset: t('effects.calmReset', language),
      jitter: t('effects.jitter', language),
      swirlPulse: t('effects.swirlPulse', language),
      spiralFlow: t('effects.spiralFlow', language),
      riverFlow: t('effects.riverFlow', language),
      mandelbrotZoom: t('effects.mandelbrotZoom', language),
      reactionDiffusionBloom: t('effects.reactionDiffusionBloom', language),
      harmonicPendulum: t('effects.harmonicPendulum', language),
      starfield: t('effects.starfield', language),
    }),
    [language]
  );

  const overlayEffectTooltips = useMemo(
    () => ({
      calmReset: t('effects.calmReset.tooltip', language),
      jitter: t('effects.jitter.tooltip', language),
      swirlPulse: t('effects.swirlPulse.tooltip', language),
      spiralFlow: t('effects.spiralFlow.tooltip', language),
      riverFlow: t('effects.riverFlow.tooltip', language),
      mandelbrotZoom: t('effects.mandelbrotZoom.tooltip', language),
      reactionDiffusionBloom: t('effects.reactionDiffusionBloom.tooltip', language),
      harmonicPendulum: t('effects.harmonicPendulum.tooltip', language),
      starfield: t('effects.starfield.tooltip', language),
    }),
    [language]
  );

  const openDotfieldOverlay = useCallback(() => {
    if (overlayFadeTimeoutRef.current && typeof window !== "undefined") {
      window.clearTimeout(overlayFadeTimeoutRef.current);
      overlayFadeTimeoutRef.current = null;
    }
    setIsDotfieldOverlayLeaving(false);
    if (!isDotfieldOverlayMounted) {
      setIsDotfieldOverlayMounted(true);
      if (typeof window !== "undefined") {
        overlayAnimationFrameRef.current = window.requestAnimationFrame(() => {
          setIsDotfieldOverlayOpen(true);
          overlayAnimationFrameRef.current = null;
        });
      } else {
        setIsDotfieldOverlayOpen(true);
      }
    } else {
      setIsDotfieldOverlayOpen(true);
    }
  }, [isDotfieldOverlayMounted]);

  const closeDotfieldOverlay = useCallback(() => {
    if (overlayAnimationFrameRef.current && typeof window !== "undefined") {
      window.cancelAnimationFrame(overlayAnimationFrameRef.current);
      overlayAnimationFrameRef.current = null;
    }
    if (!isDotfieldOverlayMounted && !isDotfieldOverlayOpen) {
      return;
    }
    setIsDotfieldOverlayOpen(false);
    setIsDotfieldOverlayLeaving(true);
    setIsDotfieldFieldPanelOpen(false);
    if (overlayFadeTimeoutRef.current && typeof window !== "undefined") {
      window.clearTimeout(overlayFadeTimeoutRef.current);
      overlayFadeTimeoutRef.current = null;
    }
    if (typeof window !== "undefined") {
      overlayFadeTimeoutRef.current = window.setTimeout(() => {
        setIsDotfieldOverlayMounted(false);
        setIsDotfieldOverlayLeaving(false);
        overlaySceneRef.current = null;
        overlayFadeTimeoutRef.current = null;
      }, DOTFIELD_OVERLAY_FADE_MS);
    } else {
      setIsDotfieldOverlayMounted(false);
      setIsDotfieldOverlayLeaving(false);
      overlaySceneRef.current = null;
    }
  }, [isDotfieldOverlayMounted, isDotfieldOverlayOpen]);

  const toggleDotfieldOverlay = useCallback(() => {
    if (isDotfieldOverlayOpen) {
      closeDotfieldOverlay();
    } else {
      openDotfieldOverlay();
    }
  }, [isDotfieldOverlayOpen, openDotfieldOverlay, closeDotfieldOverlay]);

  const handleDotfieldClose = useCallback(() => {
    closeDotfieldOverlay();
  }, [closeDotfieldOverlay]);

  const toggleDotfieldFieldPanel = useCallback(() => {
    setIsDotfieldFieldPanelOpen((prev) => !prev);
  }, []);

  const [status, setStatus] = useState(waitingStatus);
  const [navReady, setNavReady] = useState(false);
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

  const activeStatus = useMemo(() => {
    if (activeItem) {
      return createStatus(activeItem.status, 'active');
    }
    return waitingStatus;
  }, [activeItem, createStatus, waitingStatus]);
  
  // Update status when active item changes or language changes
  useEffect(() => {
    setStatus(activeStatus);
  }, [activeStatus]);

  useEffect(() => {
    if (!isDotfieldOverlayOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDotfieldOverlay();
      }
    };

    const originalOverflow = typeof document !== "undefined" ? document.body.style.overflow : undefined;
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", handleKeyDown);
      }
      if (typeof document !== "undefined") {
        document.body.style.overflow = originalOverflow ?? "";
      }
    };
  }, [isDotfieldOverlayOpen, closeDotfieldOverlay]);

  useEffect(() => {
    if (lastPathnameRef.current === pathname) {
      return;
    }

    lastPathnameRef.current = pathname;

    if (isDotfieldOverlayOpen || isDotfieldOverlayMounted || isDotfieldOverlayLeaving) {
      closeDotfieldOverlay();
    }
  }, [pathname, isDotfieldOverlayOpen, isDotfieldOverlayMounted, isDotfieldOverlayLeaving, closeDotfieldOverlay]);

  useEffect(() => {
    if (typeof window === "undefined") {
      setNavReady(true);
      return;
    }

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    if (prefersReducedMotion?.matches) {
      setNavReady(true);
      return () => {};
    }

    let frameId = window.requestAnimationFrame(() => {
      setNavReady(true);
    });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    if (!isDotfieldFieldPanelOpen) return;
    if (typeof document === "undefined") {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        !event.target.closest?.(".dotfield-overlay__panel") &&
        !event.target.closest?.(".dotfield-overlay__control--icon")
      ) {
        setIsDotfieldFieldPanelOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isDotfieldFieldPanelOpen]);

  useEffect(() => {
    return () => {
      if (overlayFadeTimeoutRef.current && typeof window !== "undefined") {
        window.clearTimeout(overlayFadeTimeoutRef.current);
      }
      if (overlayAnimationFrameRef.current && typeof window !== "undefined") {
        window.cancelAnimationFrame(overlayAnimationFrameRef.current);
      }
    };
  }, []);

  // Update localized content when language changes
  useEffect(() => {
    setBrand(t('brand.name', language));
    setMenuItems(getLocalizedMenuItems(language));
  }, [language]);

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
        
        // Localize menu items
        const items = (data.primaryMenu || []).map((i) => {
          const localizedLabel = i.id ? t(`nav.${i.id}`, language) : i.label;
          const localizedDesc = i.id ? getLocalizedContent(i.description, language) : i.description;
          
          return {
            id: i.id,
            label: localizedLabel,
            href: i.route,
            status: { title: localizedLabel, description: localizedDesc },
          };
        });
        
        setBrand(t('brand.name', language));
        setMenuItems(items.length ? items : getLocalizedMenuItems(language));
      } catch (e) {
        void e; // fallback silently
      }
    })();
    return () => {
      ignore = true;
    };
  }, [language]); // Add language as dependency
  
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

  // Navigation is always ready now to avoid hydration mismatches
  // The CSS animations handle the visual transitions

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
    
    if (isHome && isAnimatingOut) {
      // Start the leave animation if not already started
      if (!headerLeaving) {
        setHeaderLeaving(true);
      }
      
      // Set up timer to complete the animation
      if (!headerLeaveTimerRef.current) {
        headerLeaveTimerRef.current = setTimeout(() => {
          headerLeavingRef.current = false;
          setHeaderVisible(false);
          setHeaderLeaving(false);
          setIsAnimatingOut(false); // Clear animation flag
          setPrevIsHome(true); // NOW update the prev state after animation
          headerLeaveTimerRef.current = null;
        }, prefersReducedMotion ? 0 : 950);
      }
    } else if (isHome && !isAnimatingOut) {
      // On home, not animating - ensure header is hidden
      if (headerVisible) {
        setHeaderVisible(false);
        setHeaderLeaving(false);
        headerLeavingRef.current = false;
      }
    } else {
      // Not on home page - show header
      clearHeaderLeaveTimer();
      
      if (!headerVisible && !headerLeavingRef.current) {
        // Show header immediately
        headerLeavingRef.current = false;
        setHeaderVisible(true);
        setHeaderLeaving(false);
      } else if (headerLeavingRef.current) {
        // If we were in the middle of leaving but route changed, cancel it
        clearHeaderLeaveTimer();
        headerLeavingRef.current = false;
        setHeaderLeaving(false);
        setHeaderVisible(true);
      }
    }

    return clearHeaderLeaveTimer;
  }, [isHome, isAnimatingOut, headerVisible, headerLeaving]); // Include animation state in dependencies

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

  const handleStatusChange = useCallback((next) => {
    if (!next) return;
    const modeKey = next.modeKey ?? 'preview';
    setStatus(createStatus(next, modeKey));
  }, [createStatus]);

  const handleMenuReset = () => {
    setStatus(activeStatus);
  };

  const handlePreview = (item, isActive) => {
    if (!item) return;
    setStatus(createStatus(item.status, isActive ? 'active' : 'preview'));
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
        spiralFlow: t('effects.spiralFlow', language),
        riverFlow: t('effects.riverFlow', language),
        mandelbrotZoom: t('effects.mandelbrotZoom', language),
        reactionDiffusionBloom: t('effects.reactionDiffusionBloom', language),
        harmonicPendulum: t('effects.harmonicPendulum', language),
        starfield: t('effects.starfield', language),
        zenMode: t('effects.calmReset', language),
        jitter: t('effects.jitter', language),
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
  }, [language]);

  const handleFieldEffect = (effectType) => {
    const targets = [];
    if (sceneRef.current) targets.push(sceneRef.current);
    if (overlaySceneRef.current) targets.push(overlaySceneRef.current);

    if (!targets.length) {
      return;
    }

    switch (effectType) {
      case 'jitter':
        targets.forEach((instance) => {
          instance?.triggerEffect?.('jitter');
        });
        break;
      case 'spiralFlow':
      case 'riverFlow':
      case 'mandelbrotZoom':
      case 'reactionDiffusionBloom':
      case 'harmonicPendulum':
      case 'starfield': {
        let success = false;
        targets.forEach((instance) => {
          if (instance?.triggerEffect?.(effectType)) {
            success = true;
          }
        });
        if (!success) {
          console.warn(`[SiteShell] Failed to trigger effect "${effectType}"`);
        }
        break;
      }
      case 'swirlPulse': {
        targets.forEach((instance) => {
          instance?.applySettings?.({
            swirlStrength: 2.5,
            swirlFrequency: 0.008,
            animationSpeed: 1.8,
            amplitude: 60
          });
        });
        setHasActiveEffect(true);
        setActiveEffectInfo({
          name: t('effects.swirlPulse', language),
          type: 'swirlPulse',
          startTime: Date.now(),
          duration: 15
        });
        setTimeout(() => {
          targets.forEach((instance) => instance?.resetToDefaults?.());
          setHasActiveEffect(false);
          setActiveEffectInfo(null);
        }, 15000);
        break;
      }
      case 'calmReset':
        if (hasActiveEffect) {
          targets.forEach((instance) => instance?.resetToDefaults?.());
          setHasActiveEffect(false);
          setActiveEffectInfo(null);
        } else {
          let triggered = false;
          targets.forEach((instance) => {
            if (instance?.triggerEffect?.('zenMode')) {
              triggered = true;
            }
          });
          if (triggered) {
            setHasActiveEffect(true);
            setActiveEffectInfo({
              name: t('effects.calmReset', language),
              type: 'zenMode',
              startTime: Date.now(),
              duration: null
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

  const dotfieldOverlay = isDotfieldOverlayMounted ? (
    <div
      className={`dotfield-overlay${isDotfieldOverlayOpen ? " is-visible" : ""}${isDotfieldOverlayLeaving ? " is-leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Dotfield exploration"
    >
      <div className="dotfield-overlay__controls">
        <button
          type="button"
          className="dotfield-overlay__control dotfield-overlay__control--primary"
          onClick={handleDotfieldClose}
        >
          {t('return.home', language)}
        </button>
        <div className="dotfield-overlay__control-group">
          <button
            type="button"
            className={`dotfield-overlay__control dotfield-overlay__control--icon${isDotfieldFieldPanelOpen ? " is-active" : ""}`}
            onClick={toggleDotfieldFieldPanel}
            aria-expanded={isDotfieldFieldPanelOpen}
            aria-controls="dotfield-overlay-panel"
            aria-label={fieldEffectsLabel}
            title={fieldEffectsLabel}
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
          {isDotfieldFieldPanelOpen ? (
            <div className="dotfield-overlay__panel" id="dotfield-overlay-panel" role="menu">
              <div className="dotfield-overlay__panel-header">
                <span>{fieldEffectsLabel}</span>
                {hasActiveEffect && activeEffectInfo ? (
                  <span>{t('menu.tooltip.effect-active', language, { effect: activeEffectInfo.name })}</span>
                ) : null}
              </div>
              <div className="dotfield-overlay__panel-grid">
                {DOTFIELD_EFFECT_SEQUENCE.map((effectKey) => (
                  <button
                    key={effectKey}
                    type="button"
                    className="dotfield-overlay__panel-btn"
                    onClick={() => handleFieldEffect(effectKey)}
                    title={overlayEffectTooltips[effectKey]}
                  >
                    <span>{overlayEffectLabels[effectKey]}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="dotfield-overlay__canvas" aria-hidden="true">
        <Suspense fallback={<div className="canvas-placeholder" aria-label="Loading dotfield" />}>
          <SceneCanvas
            activeSection={activeSectionForCanvas}
            isPaused={false}
            onEffectChange={handleEffectChange}
            isHomeScene
            showControls={false}
            ref={(instance) => {
              overlaySceneRef.current = instance;
            }}
          />
        </Suspense>
      </div>
    </div>
  ) : null;

  if (isHome) {
    return (
      <>
        {dotfieldOverlay}
        <div className="scene-wrapper">
          <Suspense fallback={<div className="canvas-placeholder" aria-label="Loading visualization" />}>
            <SceneCanvas 
              activeSection={activeSectionForCanvas} 
              isPaused={false}
              onEffectChange={handleEffectChange}
              isHomeScene
              showControls={showAdminControls}
              ref={handleSceneAttach}
            />
          </Suspense>
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
            onRipple={(x, z, strength) => {
              // Trigger a ripple without changing field effect state
              sceneRef.current?.addRipple?.(x, z, strength);
            }}
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
      {dotfieldOverlay}
      {showCanvas ? (
        <div 
          className={sceneWrapperClasses}
          data-initial-mount={isInitialMount}
        >
          <Suspense fallback={<div className="canvas-placeholder" aria-label="Loading visualization" />}>
            <SceneCanvas 
              activeSection={activeSectionForCanvas} 
              isPaused={shouldStopAnimation}
              onEffectChange={handleEffectChange}
              isHomeScene={false}
              showControls={false}
              ref={handleSceneAttach}
            />
          </Suspense>
        </div>
      ) : null}
      <div className={`site-shell${isDetailView ? " site-shell--detail" : ""}`}>
        <div className="site-shell__container">
          {/* Keep header mounted based on computed value */}
          {!isDetailView && shouldKeepHeaderMounted ? (
            <header
              className={`site-shell__header${
                hasScrolled ? " site-shell__header--shaded" : ""
              }${headerLeaving || headerLeavingRef.current ? " is-leaving" : ""}`}
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
                aria-label={brand}
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
                <BrandWordmark className="site-shell__brand-wordmark" />
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
              <div className="site-shell__icon-group">
                <button
                  type="button"
                  className={`site-shell__icon-button site-shell__icon-button--action${(isDotfieldOverlayOpen || isDotfieldOverlayMounted) ? " is-active" : ""}`}
                  onClick={toggleDotfieldOverlay}
                  aria-pressed={isDotfieldOverlayOpen}
                  aria-label={t('dotfield.open', language)}
                  title={t('dotfield.open', language)}
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
                  <DotfieldIcon className="site-shell__icon-svg" />
                </button>
                <Link
                  href="https://x.com/itsjaydesu"
                  className="site-shell__icon-button site-shell__icon-button--link"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={t('menu.social.aria', language)}
                  title={t('menu.social.aria', language)}
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
                  <XLogoIcon className="site-shell__icon-svg" />
                </Link>
                <LanguageSwitcher className="site-shell__icon-button site-shell__header-language-toggle" />
              </div>
            </header>
          ) : null}
          <p className="sr-only" aria-live="polite">
            {status.title}: {status.description} ({status.mode})
          </p>
          <main
            key={pathname}
            className={`site-shell__main${
              isDetailView ? " is-detail" : " site-shell__transition"
            }${isReturningHome ? " is-fading-out" : ""}`}
          >
            {children}
          </main>
          {!isDetailView ? <SiteFooter /> : null}
        </div>
      </div>
    </>
  );
}
