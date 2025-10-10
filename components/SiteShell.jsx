"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

  const activeStatus = useMemo(
    () =>
      activeItem ? { ...activeItem.status, mode: "active" } : DEFAULT_STATUS,
    [activeItem]
  );
  const [status, setStatus] = useState(activeStatus);
  const [navReady, setNavReady] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

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

  const handleFieldEffect = (effectType) => {
    if (!sceneRef.current) return;
    
    switch (effectType) {
      case 'dropBall':
        // Create a bouncing ball effect with splash
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
        break;
      case 'shockwave': {
        // Create an expanding spiral shockwave
        const spiralPoints = 3; // Number of spiral arms
        const loops = 2; // Number of loops in the spiral
        let delay = 0;
        
        // Center explosion
        sceneRef.current.addRipple(0, 0, 4);
        
        // Spiral arms expanding outward
        for (let loop = 0; loop < loops; loop++) {
          for (let arm = 0; arm < spiralPoints; arm++) {
            for (let step = 0; step < 5; step++) {
              delay += 30;
              setTimeout(() => {
                const progress = (loop * 5 + step) / (loops * 5);
                const angle = (arm * (Math.PI * 2) / spiralPoints) + (progress * Math.PI * 2);
                const distance = 500 + progress * 2000;
                const x = Math.cos(angle) * distance;
                const z = Math.sin(angle) * distance;
                const strength = 3 - (progress * 2); // Decreasing strength
                sceneRef.current.addRipple(x, z, Math.max(strength, 0.5));
              }, delay);
            }
          }
        }
        
        // Random aftershocks
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 1000 + Math.random() * 1500;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            sceneRef.current.addRipple(x, z, Math.random() * 1.5 + 0.5);
          }, 600 + i * 100);
        }
        break;
      }
      case 'goldenSpiralFlow':
      case 'lissajousDance':
      case 'voronoiCrystallize':
      case 'perlinRiver':
      case 'waveInterferenceSymphony':
      case 'lorenzButterfly':
      case 'mandelbrotZoom':
      case 'reactionDiffusionBloom':
      case 'harmonicPendulum':
      case 'apollonianFractalPack':
        sceneRef.current.triggerEffect(effectType);
        break;
      case 'swirlPulse':
        // Enhance swirl effect with smooth transitions
        sceneRef.current.applySettings({
          swirlStrength: 2.5,
          swirlFrequency: 0.008,
          animationSpeed: 1.8,
          amplitude: 60
        });
        // Don't reset - let it continue until user chooses another effect
        break;
      case 'calmReset':
        // Reset to default calm state
        sceneRef.current.resetToDefaults();
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
        <SceneCanvas 
          activeSection={activeSectionForCanvas} 
          isPaused={false}
          ref={sceneRef}
        />
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
        <SceneCanvas activeSection={activeSectionForCanvas} isPaused={false} />
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
