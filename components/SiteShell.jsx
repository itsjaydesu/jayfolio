'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import RetroMenu from './RetroMenu';
import { SITE_TEXT_DEFAULTS } from '../lib/siteTextDefaults';
import SceneCanvas from './SceneCanvas';

const DEFAULT_MENU_ITEMS = SITE_TEXT_DEFAULTS.primaryMenu.map((i) => ({
  id: i.id,
  label: i.label,
  href: i.route,
  status: { title: i.label, description: i.description }
}));

const DEFAULT_STATUS = {
  title: 'Signal Router',
  description: 'Choose a channel to dive into its dossier. Hover to preview, click to enter.',
  mode: 'idle'
};

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const [brand, setBrand] = useState(SITE_TEXT_DEFAULTS.brand);
  const [menuItems, setMenuItems] = useState(DEFAULT_MENU_ITEMS);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/site-text', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load site text');
        if (ignore) return;
        const items = (data.primaryMenu || []).map((i) => ({
          id: i.id,
          label: i.label,
          href: i.route,
          status: { title: i.label, description: i.description }
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

  const pathSegments = useMemo(() => pathname?.split('/').filter(Boolean) ?? [], [pathname]);
  const primarySegment = pathSegments[0] ?? null;
  const activeItem = useMemo(
    () => menuItems.find((item) => item.id === primarySegment) ?? null,
    [primarySegment, menuItems]
  );
  const activeSection = activeItem?.id ?? null;
  const isDetailView = pathSegments.length > 1 && Boolean(activeItem);
  const isAdminView = primarySegment === 'admin';
  const isHome = pathSegments.length === 0;

  const activeStatus = useMemo(
    () => (activeItem ? { ...activeItem.status, mode: 'active' } : DEFAULT_STATUS),
    [activeItem]
  );
  const [status, setStatus] = useState(activeStatus);
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  const handleStatusChange = (next) => {
    if (!next) return;
    setStatus(next);
  };

  const handleMenuReset = () => {
    setStatus(activeStatus);
  };

  const handlePreview = (item, isActive) => {
    if (!item) return;
    setStatus({ ...item.status, mode: isActive ? 'active' : 'preview' });
  };

  const handleReset = () => {
    setStatus(activeStatus);
  };

  if (isAdminView) {
    return (
      <div className="site-shell site-shell--plain">
        <div className="admin-stage">{children}</div>
      </div>
    );
  }

  const activeSectionForCanvas = activeSection ?? 'about';
  const showCanvas = !isDetailView;

  if (isHome) {
    return (
      <>
        <SceneCanvas activeSection={activeSectionForCanvas} isPaused={false} />
        <div className="menu-overlay is-visible">
          <RetroMenu
            id="retro-menu"
            items={menuItems}
            activeSection={activeSection}
            status={status}
            activeStatus={activeStatus}
            onStatusChange={handleStatusChange}
            onNavigate={handleMenuReset}
            isOpen
            variant="centerpiece"
          />
        </div>
      </>
    );
  }

  return (
    <>
      {showCanvas ? <SceneCanvas activeSection={activeSectionForCanvas} isPaused={false} /> : null}
      <div className={`site-shell${isDetailView ? ' site-shell--detail' : ''}`}>
        <div className="site-shell__container">
          {!isDetailView ? (
            <header
              className="site-shell__header"
              data-nav-ready={navReady ? 'true' : 'false'}
              style={
                navReady
                  ? undefined
                  : {
                      opacity: 'var(--nav-initial-opacity, 0)',
                      transform: 'translate(-50%, var(--nav-initial-offset, -18px))'
                    }
              }
            >
              <Link
                href="/"
                className="site-shell__brand"
                style={
                  navReady
                    ? undefined
                    : {
                        opacity: 'var(--nav-item-initial-opacity, 0)',
                        transform: 'translateY(var(--nav-item-initial-offset, 8px))'
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
                      className={`site-shell__nav-link${isActive ? ' is-active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                      onMouseEnter={() => handlePreview(item, isActive)}
                      onMouseLeave={handleReset}
                      onFocus={() => handlePreview(item, isActive)}
                      onBlur={handleReset}
                      style={
                        navReady
                          ? {
                              transitionDelay: `${index * 60}ms`
                            }
                          : {
                              opacity: 'var(--nav-item-initial-opacity, 0)',
                              transform: 'translateY(var(--nav-item-initial-offset, 12px))'
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
                        opacity: 'var(--nav-item-initial-opacity, 0)',
                        transform: 'translateY(var(--nav-item-initial-offset, 8px))'
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
            className={`site-shell__main${isDetailView ? ' is-detail' : ' site-shell__transition'}`}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
