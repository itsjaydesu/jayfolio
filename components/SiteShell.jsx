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
import LanguageTransitionRoot from "./LanguageTransitionRoot";

const DOTFIELD_OVERLAY_FADE_MS = 520;
// Minimum header backdrop opacity on subpages so the menu is readable
// over content even at scroll position 0. Kept subtle to avoid a heavy box.
const HEADER_BASE_SHADE = 0.16; // ~16% base, escalates with scroll
const DOTFIELD_EFFECT_SEQUENCE = [
  'jitter',
  'swirlPulse',
  'spiralFlow',
  'riverFlow',
  'mandelbrotZoom',
  'reactionDiffusionBloom',
  'harmonicPendulum',
  'starfield'
];

// Removed: Header observer no longer needed without shaded background

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

export default function SiteShell({ children, channelContent }) {
  const pathname = usePathname();
  const router = useRouter();
  const sceneRef = useRef(null);
  const overlaySceneRef = useRef(null);
  const scenePreloadTriggeredRef = useRef(false);
  const homePrefetchedRef = useRef(false);
  const initialReducedMotionPreference =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersReducedMotionRef = useRef(initialReducedMotionPreference);
  const { language } = useLanguage();
  const footerChannelContent = channelContent ?? {};
  const returnTimerRef = useRef(null);
  const { isAdmin: clientAdmin } = useAdminStatus();
  const isAdminActive = clientAdmin;
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(initialReducedMotionPreference);
  const mobileMenuButtonRef = useRef(null);
  const mobileMenuListRef = useRef(null);
  const mobileMenuContainerRef = useRef(null);
  const headerInnerRef = useRef(null);
  const brandRef = useRef(null);
  const navRef = useRef(null);
  const iconGroupRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileMenuFocusIndex, setMobileMenuFocusIndex] = useState(-1);
  const [mobileMenuPosition, setMobileMenuPosition] = useState(null);
  const [isNavCondensed, setIsNavCondensed] = useState(false);

  const warmSceneChunk = useCallback(() => {
    if (scenePreloadTriggeredRef.current) {
      return;
    }
    if (prefersReducedMotionRef.current) {
      return;
    }
    if (typeof SceneCanvas?.preload === 'function') {
      SceneCanvas.preload();
      scenePreloadTriggeredRef.current = true;
    }
  }, []);
  
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

  useEffect(() => {
    if (!isHome) {
      return;
    }
    warmSceneChunk();
  }, [isHome, warmSceneChunk]);

  useEffect(() => {
    if (typeof window === 'undefined' || isHome || homePrefetchedRef.current) {
      return undefined;
    }

    const schedule = window.requestIdleCallback
      ? window.requestIdleCallback
      : (callback) => window.setTimeout(callback, 180);
    const cancel = window.cancelIdleCallback
      ? window.cancelIdleCallback
      : window.clearTimeout;

    const id = schedule(() => {
      warmSceneChunk();
      try {
        router.prefetch('/');
      } catch {
        // Ignore router prefetch errors triggered by offline or rapid navigation
      }
      homePrefetchedRef.current = true;
    });

    return () => cancel(id);
  }, [isHome, router, warmSceneChunk]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleLanguageRipple = (event) => {
      if (!isHome) {
        return;
      }

      const detail = event?.detail;
      if (process.env.NODE_ENV !== 'production') {
        console.log('[SiteShell] languagechange:start received', {
          isHome,
          detail,
        });
      }
      if (!detail || (detail.source && detail.source !== 'header-toggle')) {
        return;
      }

      const { originX, originY } = detail;
      if (!sceneRef.current?.addRipple) {
        return;
      }

      const viewportWidth = window.innerWidth || 1;
      const viewportHeight = window.innerHeight || 1;
      const normalizedX = typeof originX === 'number' ? originX / viewportWidth - 0.5 : 0;
      const normalizedY = typeof originY === 'number' ? originY / viewportHeight - 0.5 : 0;
      const fieldX = normalizedX * 0.6;
      const fieldZ = -normalizedY * 0.6;

      sceneRef.current.addRipple(fieldX, fieldZ, 0.7);
    };

    window.addEventListener('languagechange:start', handleLanguageRipple);
    return () => {
      window.removeEventListener('languagechange:start', handleLanguageRipple);
    };
  }, [isHome]);
  
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
  const [menuVisible, setMenuVisible] = useState(isHome);
  const [headerVisible, setHeaderVisible] = useState(!isHome);
  // Ensure a small baseline shade on non-home views so header blur is visible on fade-in
  const [headerShade, setHeaderShade] = useState(!isHome ? HEADER_BASE_SHADE : 0);
  const [isDotfieldOverlayOpen, setIsDotfieldOverlayOpen] = useState(false);
  const [isDotfieldOverlayMounted, setIsDotfieldOverlayMounted] = useState(false);
  const [isDotfieldOverlayLeaving, setIsDotfieldOverlayLeaving] = useState(false);
  const [isDotfieldFieldPanelOpen, setIsDotfieldFieldPanelOpen] = useState(false);
  const overlayFadeTimeoutRef = useRef(null);
  const overlayAnimationFrameRef = useRef(null);
  const lastPathnameRef = useRef(pathname);
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

  const updateNavCondensed = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const headerElement = headerInnerRef.current;
    const navElement = navRef.current;
    if (!headerElement || !navElement) {
      setIsNavCondensed(false);
      return;
    }

    const brandElement = brandRef.current;
    const iconElement = iconGroupRef.current;

    const headerWidth = headerElement.clientWidth;
    const brandWidth = brandElement?.offsetWidth ?? 0;
    const iconWidth = iconElement?.offsetWidth ?? 0;
    const computedStyle = window.getComputedStyle(headerElement);
    const gapValue = parseFloat(computedStyle.columnGap || computedStyle.gap || '0');
    const gap = Number.isNaN(gapValue) ? 0 : gapValue;

    const availableNavWidth = headerWidth - brandWidth - iconWidth - gap * 2;

    if (availableNavWidth <= 0) {
      setIsNavCondensed(true);
      return;
    }

    const navContentWidth = navElement.scrollWidth || navElement.getBoundingClientRect().width;

    if (navContentWidth === 0 && menuItems.length) {
      setIsNavCondensed(true);
      return;
    }

    setIsNavCondensed((previous) => {
      const needsCondensed = navContentWidth > availableNavWidth + 1;
      return previous === needsCondensed ? previous : needsCondensed;
    });
  }, [menuItems.length]);

  const updateHeaderShade = useCallback((value) => {
    // Clamp incoming value and enforce a baseline shade on subpages
    const clamped = Math.min(Math.max(value, 0), 1);
    const effective = (!isHome && headerVisible)
      ? Math.max(clamped, HEADER_BASE_SHADE)
      : clamped;
    setHeaderShade((previous) => (Math.abs(previous - effective) < 0.01 ? previous : effective));
  }, [isHome, headerVisible]);

  // Keep baseline shade in sync if route/visibility changes (e.g., navigation or layout toggles)
  useEffect(() => {
    if (!isHome && headerVisible) {
      setHeaderShade((s) => (s < HEADER_BASE_SHADE ? HEADER_BASE_SHADE : s));
    } else if (isHome) {
      setHeaderShade(0);
    }
  }, [isHome, headerVisible]);

  useEffect(() => {
    updateNavCondensed();
  }, [menuItems, updateNavCondensed]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let animationFrameId = null;

    const scheduleUpdate = () => {
      if (animationFrameId && typeof window !== 'undefined') {
        window.cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = window.requestAnimationFrame(() => {
        updateNavCondensed();
        animationFrameId = null;
      });
    };

    scheduleUpdate();

    const observedElements = [
      headerInnerRef.current,
      navRef.current,
      brandRef.current,
      iconGroupRef.current,
    ].filter(Boolean);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      observedElements.forEach((element) => resizeObserver.observe(element));
    }

    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (animationFrameId && typeof window !== 'undefined') {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', scheduleUpdate);
      if (resizeObserver) {
        observedElements.forEach((element) => resizeObserver.unobserve(element));
        resizeObserver.disconnect();
      }
    };
  }, [updateNavCondensed]);

  useEffect(() => {
    if (!isNavCondensed && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isNavCondensed, isMobileMenuOpen]);

  const openDotfieldOverlay = useCallback(() => {
    if (prefersReducedMotionRef.current) {
      return;
    }
    warmSceneChunk();
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
  }, [isDotfieldOverlayMounted, warmSceneChunk]);

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
  const [hasActiveEffect, setHasActiveEffect] = useState(false);
  const [activeEffectInfo, setActiveEffectInfo] = useState(null); // { name, startTime, duration }

  // Active menu item computation
  const activeItem = useMemo(
    () => menuItems.find((item) => item.id === primarySegment) ?? null,
    [primarySegment, menuItems]
  );
  const activeSection = activeItem?.id ?? null;
  const isDetailView = pathSegments.length > 1 && Boolean(activeItem);
  const mobileMenuLabel = t('nav.mobile-menu-label', language);
  const mobileMenuPlaceholder = t('nav.mobile-menu-placeholder', language);
  const activeMenuIndex = useMemo(
    () => menuItems.findIndex((item) => item.id === activeSection),
    [menuItems, activeSection]
  );

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

  const isHeaderShaded = headerShade > 0.05;
  const isListingChannel =
    !isHome && !isDetailView &&
    (primarySegment === 'projects' ||
      primarySegment === 'content' ||
      primarySegment === 'sounds' ||
      primarySegment === 'art');

  const shellDataProps = {
    ...(isListingChannel ? { 'data-channel-layout': 'list', 'data-channel-id': primarySegment } : {}),
  };

  const headerClassName = `site-shell__header${isHeaderShaded ? " is-scrolled" : ""}`;
  const headerStyle = navReady
    ? { '--header-backdrop-opacity': headerShade }
    : {
        '--header-backdrop-opacity': headerShade,
        opacity: "var(--nav-initial-opacity, 0)",
        transform: "translateY(var(--nav-initial-offset, -18px))",
      };
  const containerClassName = "site-shell__container";
  const dropdownDisplayLabel =
    activeSection && activeMenuIndex >= 0
      ? menuItems[activeMenuIndex]?.label ?? mobileMenuPlaceholder
      : mobileMenuPlaceholder;

  const mobileMenuInlineStyle = useMemo(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }
    if (!mobileMenuPosition) {
      return { visibility: "hidden" };
    }
    return {
      top: `${mobileMenuPosition.top}px`,
      left: `${mobileMenuPosition.left}px`,
      width: `${mobileMenuPosition.width}px`,
    };
  }, [isMobileMenuOpen, mobileMenuPosition]);

  useEffect(() => {
    if (!isListingChannel) {
      return undefined;
    }

    if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
      return undefined;
    }

    const logLayout = (reason) => {
      const channelEl = document.querySelector('.channel');
      const footerEl = document.querySelector('.site-footer');
      const mainEl = document.querySelector('.site-shell__main');

      if (!channelEl || !footerEl || !mainEl) {
        console.log('[ListingLayout] skipped log (missing elements)', {
          reason,
          hasChannel: Boolean(channelEl),
          hasFooter: Boolean(footerEl),
          hasMain: Boolean(mainEl),
        });
        return;
      }

      const channelRect = channelEl.getBoundingClientRect();
      const footerRect = footerEl.getBoundingClientRect();
      const mainRect = mainEl.getBoundingClientRect();

      console.group(`[ListingLayout] ${reason}`);
      console.log('channel', {
        height: channelRect.height,
        top: channelRect.top,
        bottom: channelRect.bottom,
        marginBottom: getComputedStyle(channelEl).marginBottom,
        paddingBottom: getComputedStyle(channelEl).paddingBottom,
      });
      console.log('main', {
        height: mainRect.height,
        top: mainRect.top,
        bottom: mainRect.bottom,
        paddingBottom: getComputedStyle(mainEl).paddingBottom,
      });
      console.log('footer', {
        height: footerRect.height,
        top: footerRect.top,
        marginTop: getComputedStyle(footerEl).marginTop,
        minHeight: getComputedStyle(footerEl).minHeight,
        paddingTop: getComputedStyle(footerEl).paddingTop,
      });
      console.groupEnd();
    };

    const handleResize = () => logLayout('resize');
    const rafId = window.requestAnimationFrame(() => logLayout('initial'));
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isListingChannel]);

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
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) {
      return undefined;
    }

    const handleChange = (event) => {
      const matches = event.matches;
      prefersReducedMotionRef.current = matches;
      setPrefersReducedMotion(matches);
    };

    prefersReducedMotionRef.current = mediaQuery.matches;
    setPrefersReducedMotion(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }

    return undefined;
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
    };
  }, [router]);

  // Simple menu visibility - show on home, hide elsewhere
  useEffect(() => {
    setMenuVisible(isHome);
  }, [isHome]);

  // Simple header visibility - hide on home, show elsewhere
  useEffect(() => {
    setHeaderVisible(!isHome);
  }, [isHome]);

  // DIAGNOSTIC: Log alignment on mount and when page changes (only if ?debug=true in URL)
  useEffect(() => {
    const isDebugMode = typeof window !== 'undefined' && window.location.search.includes('debug=true');
    if (!isDebugMode) return;
    
    const logAlignment = () => {
      console.group('🔍 ALIGNMENT DIAGNOSTIC');
      
      const brand = document.querySelector('.site-shell__brand');
      const brandWordmark = document.querySelector('.brand-wordmark');
      const headerInner = document.querySelector('.site-shell__header-inner');
      const mainContainer = document.querySelector('.site-shell__main');
      const channelTitle = document.querySelector('.channel__title');
      const aboutTitle = document.querySelector('.about-page__title');
      const h1 = document.querySelector('main h1');
      
      console.log('🎯 Brand element:', {
        element: brand,
        left: brand?.getBoundingClientRect().left,
        paddingLeft: brand ? getComputedStyle(brand).paddingLeft : 'N/A',
        marginLeft: brand ? getComputedStyle(brand).marginLeft : 'N/A'
      });
      
      console.log('📝 Brand Wordmark:', {
        element: brandWordmark,
        left: brandWordmark?.getBoundingClientRect().left,
        paddingLeft: brandWordmark ? getComputedStyle(brandWordmark).paddingLeft : 'N/A'
      });
      
      console.log('📦 Header Inner:', {
        element: headerInner,
        left: headerInner?.getBoundingClientRect().left,
        paddingLeft: headerInner ? getComputedStyle(headerInner).paddingLeft : 'N/A',
        maxWidth: headerInner ? getComputedStyle(headerInner).maxWidth : 'N/A'
      });
      
      console.log('📦 Main Container:', {
        element: mainContainer,
        left: mainContainer?.getBoundingClientRect().left,
        paddingLeft: mainContainer ? getComputedStyle(mainContainer).paddingLeft : 'N/A',
        maxWidth: mainContainer ? getComputedStyle(mainContainer).maxWidth : 'N/A'
      });
      
      console.log('🏷️ Page Title Elements:', {
        channelTitle: {
          element: channelTitle,
          left: channelTitle?.getBoundingClientRect().left,
          text: channelTitle?.textContent
        },
        aboutTitle: {
          element: aboutTitle,
          left: aboutTitle?.getBoundingClientRect().left,
          text: aboutTitle?.textContent
        },
        h1: {
          element: h1,
          left: h1?.getBoundingClientRect().left,
          text: h1?.textContent
        }
      });
      
      console.log('📏 Alignment Differences:', {
        'brand vs h1': brand && h1 ? Math.abs(brand.getBoundingClientRect().left - h1.getBoundingClientRect().left).toFixed(2) + 'px' : 'N/A',
        'brand vs channelTitle': brand && channelTitle ? Math.abs(brand.getBoundingClientRect().left - channelTitle.getBoundingClientRect().left).toFixed(2) + 'px' : 'N/A',
        'brand vs aboutTitle': brand && aboutTitle ? Math.abs(brand.getBoundingClientRect().left - aboutTitle.getBoundingClientRect().left).toFixed(2) + 'px' : 'N/A'
      });
      
      console.log('🎨 CSS Custom Properties:', {
        shellInlinePad: getComputedStyle(document.documentElement).getPropertyValue('--shell-inline-pad')
      });
      
      console.log('🏗️ DOM Structure:', {
        'Is channel in main?': !!mainContainer?.querySelector('.channel'),
        'Is channel direct child of main?': Array.from(mainContainer?.children || []).some(el => el.classList.contains('channel')),
        'Channel parent': document.querySelector('.channel')?.parentElement?.className,
        'Channel computed styles': document.querySelector('.channel') ? {
          width: getComputedStyle(document.querySelector('.channel')).width,
          maxWidth: getComputedStyle(document.querySelector('.channel')).maxWidth,
          paddingLeft: getComputedStyle(document.querySelector('.channel')).paddingLeft,
          paddingRight: getComputedStyle(document.querySelector('.channel')).paddingRight,
        } : 'No channel element'
      });
      
      console.groupEnd();
    };
    
    // Log after a short delay to ensure DOM is ready
    const timer = setTimeout(logAlignment, 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  const closeMobileMenu = useCallback(
    (returnFocus = false) => {
      setIsMobileMenuOpen(false);
      setMobileMenuFocusIndex(-1);
      if (returnFocus && mobileMenuButtonRef.current) {
        mobileMenuButtonRef.current.focus();
      }
    },
    []
  );

  const openMobileMenu = useCallback(() => {
    if (!menuItems.length) {
      return;
    }
    setIsMobileMenuOpen(true);
    setMobileMenuFocusIndex(activeMenuIndex >= 0 ? activeMenuIndex : 0);
  }, [menuItems, activeMenuIndex]);

  const updateMobileMenuPosition = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const buttonNode = mobileMenuButtonRef.current;
    if (!buttonNode) {
      return;
    }

    const rect = buttonNode.getBoundingClientRect();
    const viewportPadding = 16;
    const minWidth = 200; // match design width while allowing clamping on narrow screens
    const availableWidth = Math.max(
      window.innerWidth - viewportPadding * 2,
      minWidth
    );
    const width = Math.min(
      Math.max(rect.width, minWidth),
      availableWidth
    );

    let left = rect.left;
    const maxLeft = window.innerWidth - viewportPadding - width;
    if (left < viewportPadding) {
      left = viewportPadding;
    } else if (left > maxLeft) {
      left = Math.max(viewportPadding, maxLeft);
    }

    const top = rect.bottom + 12;

    setMobileMenuPosition({
      top,
      left,
      width,
    });
  }, []);

  const handleMobileMenuToggle = useCallback(() => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
      return;
    }
    openMobileMenu();
  }, [isMobileMenuOpen, closeMobileMenu, openMobileMenu]);

  const handleMobileMenuSelect = useCallback(
    (item) => {
      if (!item) {
        return;
      }
      closeMobileMenu(true);

      if (pathname === item.href) {
        return;
      }

      try {
        router.push(item.href);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[SiteShell] Failed to navigate via mobile menu", error);
        }
      }
    },
    [closeMobileMenu, pathname, router]
  );

  const handleMobileMenuKeyDown = useCallback(
    (event) => {
      if (!isMobileMenuOpen) {
        if ((event.key === "ArrowDown" || event.key === "ArrowUp") && menuItems.length) {
          event.preventDefault();
          openMobileMenu();
        }
        return;
      }

      if (!menuItems.length) {
        return;
      }

      const lastIndex = menuItems.length - 1;

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          setMobileMenuFocusIndex((prev) => {
            const nextIndex = prev < 0 ? 0 : Math.min(prev + 1, lastIndex);
            return nextIndex;
          });
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          setMobileMenuFocusIndex((prev) => {
            const nextIndex = prev < 0 ? lastIndex : Math.max(prev - 1, 0);
            return nextIndex;
          });
          break;
        }
        case "Home": {
          event.preventDefault();
          setMobileMenuFocusIndex(0);
          break;
        }
        case "End": {
          event.preventDefault();
          setMobileMenuFocusIndex(lastIndex);
          break;
        }
        case "Enter":
        case " ": {
          event.preventDefault();
          const item = menuItems[mobileMenuFocusIndex >= 0 ? mobileMenuFocusIndex : activeMenuIndex >= 0 ? activeMenuIndex : 0];
          handleMobileMenuSelect(item);
          break;
        }
        case "Escape": {
          event.preventDefault();
          closeMobileMenu(true);
          break;
        }
        case "Tab": {
          closeMobileMenu();
          break;
        }
        default:
          break;
      }
    },
    [
      activeMenuIndex,
      closeMobileMenu,
      handleMobileMenuSelect,
      isMobileMenuOpen,
      menuItems,
      mobileMenuFocusIndex,
      openMobileMenu,
    ]
  );

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        mobileMenuButtonRef.current?.contains(event.target) ||
        mobileMenuContainerRef.current?.contains(event.target)
      ) {
        return;
      }
      closeMobileMenu();
    };

    const handleGlobalKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileMenu(true);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [closeMobileMenu, isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      setMobileMenuPosition(null);
      return undefined;
    }

    updateMobileMenuPosition();

    const handleResize = () => {
      updateMobileMenuPosition();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [isMobileMenuOpen, updateMobileMenuPosition]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const listElement = mobileMenuListRef.current;
    if (listElement) {
      listElement.focus();
    }

    return undefined;
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }
    if (!menuItems.length) {
      setMobileMenuFocusIndex(-1);
      return;
    }
    setMobileMenuFocusIndex(activeMenuIndex >= 0 ? activeMenuIndex : 0);
  }, [activeMenuIndex, isMobileMenuOpen, menuItems.length]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }
    if (mobileMenuFocusIndex < 0 || mobileMenuFocusIndex >= menuItems.length) {
      return;
    }
    const optionId = `site-shell-mobile-nav-option-${menuItems[mobileMenuFocusIndex].id}`;
    const listNode = mobileMenuListRef.current;
    const optionNode = optionId && listNode?.querySelector
      ? listNode.querySelector(`#${optionId}`)
      : null;
    if (optionNode && optionNode.scrollIntoView) {
      optionNode.scrollIntoView({ block: "nearest" });
    }
  }, [isMobileMenuOpen, menuItems, mobileMenuFocusIndex]);

  useEffect(() => {
    closeMobileMenu();
  }, [closeMobileMenu, pathname]);

  // Enhanced scroll detection for header background fade effect
  // Uses requestAnimationFrame for better performance and multiple scroll sources
  useEffect(() => {
    if (isHome || !headerVisible) {
      updateHeaderShade(0);
      return;
    }

    let ticking = false;
    let rafId = null;
    const scrollStart = 12;
    const scrollRange = 220;

    const updateScrollPosition = () => {
      const scrollY = Math.max(
        window.pageYOffset || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0,
        document.scrollingElement?.scrollTop || 0
      );

      const rawProgress = (scrollY - scrollStart) / scrollRange;
      const normalized = Math.min(Math.max(rawProgress, 0), 1);
      const eased = normalized === 0 || normalized === 1 ? normalized : Math.pow(normalized, 0.82);
      updateHeaderShade(eased);
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    document.addEventListener('scroll', requestTick, { passive: true });

    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.addEventListener('scroll', requestTick, { passive: true });
    }

    updateScrollPosition();

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', requestTick);
      document.removeEventListener('scroll', requestTick);
      if (mainEl) {
        mainEl.removeEventListener('scroll', requestTick);
      }
    };
  }, [isHome, headerVisible, updateHeaderShade]);
  
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

  // Header fade diagnostics – enable with ?debug-fade=true (or debug=true)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search;
    const isDebugFade = search.includes('debug-fade=true') || search.includes('debug=true');
    if (!isDebugFade) return;

    const logHeaderFadeDiagnostics = (reason = 'manual') => {
      try {
        // Grab elements
        const header = document.querySelector('.site-shell__header');
        const headerInner = document.querySelector('.site-shell__header-inner');
        const container = document.querySelector('.site-shell__container');
        if (!header) {
          console.warn('[fade] No header found');
          return;
        }

        // Computed styles
        const cs = getComputedStyle(header);
        const csBefore = getComputedStyle(header, '::before');
        const csContainerBefore = container ? getComputedStyle(container, '::before') : null;

        // Support checks
        const supportsMask = CSS && (CSS.supports('mask-image', 'linear-gradient(black, transparent)') || CSS.supports('-webkit-mask-image', 'linear-gradient(black, transparent)'));
        const supportsBackdrop = CSS && (CSS.supports('backdrop-filter', 'blur(4px)') || CSS.supports('-webkit-backdrop-filter', 'blur(4px)'));

        // Bounding boxes
        const rect = header.getBoundingClientRect();
        const innerRect = headerInner?.getBoundingClientRect?.();

        console.groupCollapsed(`\n🧪 Header Fade Diagnostics (${reason})`);
        console.log('bounds', { rect, innerRect });
        console.log('z-index', { header: cs.zIndex, containerBefore: csContainerBefore?.zIndex });
        console.log('opacity/transform', { opacity: cs.opacity, transform: cs.transform });
        console.log('backdrop', { backdropFilter: cs.backdropFilter, webkitBackdropFilter: cs.webkitBackdropFilter, supportsBackdrop });
        console.log('mask', {
          maskImage: cs.maskImage,
          webkitMaskImage: cs.webkitMaskImage,
          maskSize: cs.maskSize,
          webkitMaskSize: cs.webkitMaskSize,
          maskComposite: cs.maskComposite,
          webkitMaskComposite: cs.webkitMaskComposite,
          supportsMask
        });
        console.log('::before pseudo', {
          exists: csBefore?.content && csBefore.content !== 'none' && csBefore.content !== 'normal',
          height: csBefore?.height,
          background: csBefore?.background,
          opacity: csBefore?.opacity,
          zIndex: csBefore?.zIndex,
        });
        console.log('container::before', csContainerBefore ? {
          exists: csContainerBefore?.content && csContainerBefore.content !== 'none' && csContainerBefore.content !== 'normal',
          zIndex: csContainerBefore?.zIndex,
          opacity: csContainerBefore?.opacity,
          top: csContainerBefore?.top,
          height: csContainerBefore?.height,
          background: csContainerBefore?.background,
          position: csContainerBefore?.position,
        } : 'n/a');
        console.groupEnd();
      } catch (e) {
        console.warn('[fade] diagnostics failed', e);
      }
    };

    const onResize = () => logHeaderFadeDiagnostics('resize');
    const onScroll = () => logHeaderFadeDiagnostics('scroll');

    // Initial
    setTimeout(() => logHeaderFadeDiagnostics('mount'), 0);
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
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
    warmSceneChunk();
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

    warmSceneChunk();

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
  const showCanvas = isHome && !isDetailView && !prefersReducedMotion;

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
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="currentColor"
            >
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
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
              <button
                type="button"
                className="dotfield-overlay__panel-btn dotfield-overlay__panel-btn--zen"
                onClick={() => handleFieldEffect('calmReset')}
                title={t('effects.calmReset.tooltip', language)}
              >
                <span>{t('effects.calmReset', language)}</span>
              </button>
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
        <LanguageTransitionRoot>
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
              activeEffectInfo={activeEffectInfo}
              onRipple={(x, z, strength) => {
                // Trigger a ripple without changing field effect state
                sceneRef.current?.addRipple?.(x, z, strength);
              }}
              isOpen
              variant="centerpiece"
            />
          </div>
        </LanguageTransitionRoot>
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
  const baseSceneWrapperClass = 'scene-wrapper';
  const sceneWrapperClasses = `${baseSceneWrapperClass}${dotsFaded ? " scene-wrapper--faded" : ""}${shouldApplyBlackBg ? " scene-wrapper--black" : ""}`;

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
      <LanguageTransitionRoot>
        <div
          className={`site-shell${isDetailView ? " site-shell--detail" : ""}`}
          {...shellDataProps}
        >
          <div className={containerClassName}>
            {/* Browser-safe top fade: sits above the header to avoid hard edge in browsers that ignore masks with backdrop-filter. */}
            {headerVisible ? (
              <div className="site-shell__top-fade" aria-hidden="true" />
            ) : null}
            {!isDetailView && headerVisible ? (
            <header
              className={headerClassName}
              data-nav-ready={navReady ? "true" : "false"}
              data-returning-home={isReturningHome ? "true" : "false"}
              data-scrolled={isHeaderShaded ? "true" : "false"}
              data-mobile-menu-open={isMobileMenuOpen ? "true" : "false"}
              data-nav-condensed={isNavCondensed ? "true" : "false"}
              style={headerStyle}
            >
              <div className="site-shell__header-inner" ref={headerInnerRef}>
                <Link
                  href="/"
                  className="site-shell__brand"
                  aria-label={brand}
                  onClick={handleNavigateHome}
                  onMouseEnter={warmSceneChunk}
                  onFocus={warmSceneChunk}
                  ref={brandRef}
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
                <div
                  className="site-shell__nav-dropdown"
                  data-has-selection={activeSection ? "true" : "false"}
                  data-open={isMobileMenuOpen ? "true" : "false"}
                >
                  <span id="site-shell-mobile-nav-label" className="sr-only">
                    {mobileMenuLabel}
                  </span>
                  <button
                    type="button"
                    className="site-shell__nav-dropdown-button"
                    aria-haspopup="listbox"
                    aria-labelledby="site-shell-mobile-nav-label site-shell-mobile-nav-button-text"
                    aria-expanded={isMobileMenuOpen ? "true" : "false"}
                    aria-controls={isMobileMenuOpen ? "site-shell-mobile-nav-list" : undefined}
                    onClick={handleMobileMenuToggle}
                    onKeyDown={handleMobileMenuKeyDown}
                    disabled={!menuItems.length}
                    ref={mobileMenuButtonRef}
                  >
                    <span
                      id="site-shell-mobile-nav-button-text"
                      className="site-shell__nav-dropdown-button-text"
                    >
                      {dropdownDisplayLabel}
                    </span>
                  </button>
                  {isMobileMenuOpen ? (
                    <div
                      className="site-shell__nav-dropdown-menu"
                      ref={mobileMenuContainerRef}
                      style={mobileMenuInlineStyle}
                    >
                      <ul
                        id="site-shell-mobile-nav-list"
                        role="listbox"
                        aria-labelledby="site-shell-mobile-nav-label"
                        aria-activedescendant={
                          menuItems.length
                            ? mobileMenuFocusIndex >= 0
                              ? `site-shell-mobile-nav-option-${menuItems[mobileMenuFocusIndex].id}`
                              : activeMenuIndex >= 0
                                ? `site-shell-mobile-nav-option-${menuItems[activeMenuIndex].id}`
                                : undefined
                            : undefined
                        }
                        className="site-shell__nav-dropdown-list"
                        ref={mobileMenuListRef}
                        tabIndex={-1}
                        onKeyDown={handleMobileMenuKeyDown}
                      >
                        {menuItems.map((item, index) => {
                          const isActiveOption = item.id === activeSection;
                          const isFocusedOption = index === mobileMenuFocusIndex;
                          return (
                            <li key={item.id} role="presentation">
                              <button
                                type="button"
                                role="option"
                                id={`site-shell-mobile-nav-option-${item.id}`}
                                className={`site-shell__nav-dropdown-option${isActiveOption ? " is-active" : ""}${isFocusedOption ? " is-focused" : ""}`}
                                aria-selected={isActiveOption}
                                data-focused={isFocusedOption ? "true" : "false"}
                                onClick={() => handleMobileMenuSelect(item)}
                                onMouseEnter={() => setMobileMenuFocusIndex(index)}
                                onFocus={() => setMobileMenuFocusIndex(index)}
                              >
                                {item.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>
                <nav
                  className="site-shell__nav"
                  aria-label="Primary navigation"
                  ref={navRef}
                  aria-hidden={isNavCondensed ? "true" : undefined}
                >
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
                        tabIndex={isNavCondensed ? -1 : undefined}
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
                <div className="site-shell__icon-group" ref={iconGroupRef}>
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
          {!isDetailView ? <SiteFooter channelContent={footerChannelContent} /> : null}
        </div>
      </div>
      </LanguageTransitionRoot>
    </>
  );
}
