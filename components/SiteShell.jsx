'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import RetroMenu from './RetroMenu';
import SceneCanvas from './SceneCanvas';

const MENU_ITEMS = [
  {
    id: 'about',
    label: 'About',
    href: '/about',
    status: {
      title: 'About',
      description:
        'Jay Winder curates lucid audiovisual experiments, shaping hypnotic interfaces that oscillate between nostalgia and the hyperreal.'
    }
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects',
    status: {
      title: 'Projects',
      description:
        'Highlights include kinetic WebGL fields, performance-driven installations, and tactile controls for curious collaborators.'
    }
  },
  {
    id: 'words',
    label: 'Words',
    href: '/words',
    status: {
      title: 'Words',
      description:
        'Dispatches chart process notes, essays on spatial computing, and glossaries for future signal-bearers.'
    }
  },
  {
    id: 'sounds',
    label: 'Sounds',
    href: '/sounds',
    status: {
      title: 'Sounds',
      description:
        'A rotating archive of ambient loops, chromatic drones, and responsive audio sketches tuned for late-night wanderers.'
    }
  }
];

const DEFAULT_STATUS = {
  title: 'Signal Router',
  description: 'Hover a channel to preview its dossier. Select to open the panel to the right.',
  mode: 'idle'
};

const DETAIL_FADE_MS = 420;
const PANEL_FADE_MS = 600;

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const pathSegments = useMemo(() => pathname?.split('/').filter(Boolean) ?? [], [pathname]);
  const primarySegment = pathSegments[0] ?? null;
  const activeItem = useMemo(
    () => MENU_ITEMS.find((item) => item.id === primarySegment) ?? null,
    [primarySegment]
  );
  const activeSection = activeItem?.id ?? null;
  const isDetailView = useMemo(
    () => pathSegments.length > 1 && Boolean(activeItem) && activeItem.id !== 'about',
    [activeItem, pathSegments]
  );
  const isAdminView = primarySegment === 'admin';
  const isContentActive = Boolean(activeItem) && !isDetailView;
  const isStandaloneView = isDetailView || isAdminView;

  const activeStatus = useMemo(
    () => (activeItem ? { ...activeItem.status, mode: 'active' } : DEFAULT_STATUS),
    [activeItem]
  );

  const [status, setStatus] = useState(activeStatus);
  const [detailNode, setDetailNode] = useState(isDetailView ? children : null);
  const [isDetailVisible, setIsDetailVisible] = useState(isDetailView);
  const [panelNode, setPanelNode] = useState(!isStandaloneView ? children : null);
  const [shouldRenderPanel, setShouldRenderPanel] = useState(!isStandaloneView);
  const [isPanelVisible, setIsPanelVisible] = useState(isContentActive && !isStandaloneView);
  const detailHideTimeoutRef = useRef(null);
  const detailFrameRef = useRef(null);
  const panelHideTimeoutRef = useRef(null);
  const panelFrameRef = useRef(null);

  useEffect(() => {
    setStatus(activeStatus);
  }, [activeStatus]);

  useEffect(() => {
    if (isDetailView) {
      setDetailNode(children);
    }
  }, [children, isDetailView]);

  useEffect(() => {
    if (isDetailView || isAdminView) return;
    setPanelNode(children);
  }, [children, isAdminView, isDetailView]);

  useEffect(() => {
    if (detailFrameRef.current) {
      cancelAnimationFrame(detailFrameRef.current);
      detailFrameRef.current = null;
    }
    if (detailHideTimeoutRef.current) {
      clearTimeout(detailHideTimeoutRef.current);
      detailHideTimeoutRef.current = null;
    }

    if (isDetailView) {
      detailFrameRef.current = requestAnimationFrame(() => {
        setIsDetailVisible(true);
        detailFrameRef.current = null;
      });
      return () => {
        if (detailFrameRef.current) {
          cancelAnimationFrame(detailFrameRef.current);
          detailFrameRef.current = null;
        }
      };
    }

    if (detailNode) {
      setIsDetailVisible(false);
      detailHideTimeoutRef.current = setTimeout(() => {
        setDetailNode(null);
        detailHideTimeoutRef.current = null;
      }, DETAIL_FADE_MS);
      return () => {
        if (detailHideTimeoutRef.current) {
          clearTimeout(detailHideTimeoutRef.current);
          detailHideTimeoutRef.current = null;
        }
      };
    }

    setIsDetailVisible(false);
    return undefined;
  }, [detailNode, isDetailView]);

  useEffect(() => () => {
    if (detailFrameRef.current) {
      cancelAnimationFrame(detailFrameRef.current);
    }
    if (detailHideTimeoutRef.current) {
      clearTimeout(detailHideTimeoutRef.current);
    }
    if (panelFrameRef.current) {
      cancelAnimationFrame(panelFrameRef.current);
    }
    if (panelHideTimeoutRef.current) {
      clearTimeout(panelHideTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (panelFrameRef.current) {
      cancelAnimationFrame(panelFrameRef.current);
      panelFrameRef.current = null;
    }
    if (panelHideTimeoutRef.current) {
      clearTimeout(panelHideTimeoutRef.current);
      panelHideTimeoutRef.current = null;
    }

    if (isAdminView) {
      setIsPanelVisible(false);
      setShouldRenderPanel(false);
      setPanelNode(null);
      return undefined;
    }

    if (!isDetailView) {
      setShouldRenderPanel(true);
      panelFrameRef.current = requestAnimationFrame(() => {
        setIsPanelVisible(isContentActive);
        panelFrameRef.current = null;
      });
      return () => {
        if (panelFrameRef.current) {
          cancelAnimationFrame(panelFrameRef.current);
          panelFrameRef.current = null;
        }
      };
    }

    if (!shouldRenderPanel) {
      setIsPanelVisible(false);
      return undefined;
    }

    setIsPanelVisible(false);
    panelHideTimeoutRef.current = setTimeout(() => {
      setShouldRenderPanel(false);
      panelHideTimeoutRef.current = null;
    }, PANEL_FADE_MS);
    return () => {
      if (panelHideTimeoutRef.current) {
        clearTimeout(panelHideTimeoutRef.current);
        panelHideTimeoutRef.current = null;
      }
    };
  }, [isAdminView, isContentActive, isDetailView, shouldRenderPanel]);

  const canvasSection = activeSection ?? 'about';
  const showOverlay = !isContentActive && !isStandaloneView;
  const shouldRenderCanvas = !isAdminView;
  const isCanvasPaused = isContentActive || isDetailView;

  const handleStatusChange = useCallback((next) => {
    setStatus(next);
  }, []);

  const handleMenuReset = useCallback(() => {
    setStatus(activeStatus);
  }, [activeStatus]);

  const handleBackdropDismiss = useCallback(() => {
    if (!isContentActive) return;
    router.push('/');
  }, [isContentActive, router]);

  const handleNestedNavigate = useCallback(
    (href) => {
      if (pathname === href) return;
      router.push(href);
    },
    [pathname, router]
  );

  return (
    <>
      {shouldRenderCanvas && <SceneCanvas activeSection={canvasSection} isPaused={isCanvasPaused} />}
      <div className="site-frame">
        <div className={`menu-overlay${showOverlay ? ' is-visible' : ''}`} aria-hidden={!showOverlay}>
          <RetroMenu
            id="retro-menu"
            items={MENU_ITEMS}
            activeSection={activeSection}
            status={status}
            activeStatus={activeStatus}
            onStatusChange={handleStatusChange}
            isOpen
            onNavigate={handleMenuReset}
            variant="centerpiece"
          />
        </div>

        {shouldRenderPanel && (
          <div className={`content-stage${isPanelVisible ? ' is-active' : ''}`}>
            <button
              type="button"
              className="content-stage__backdrop"
              aria-hidden={!isPanelVisible}
              tabIndex={-1}
              onClick={handleBackdropDismiss}
            />
            <section className="content-stage__panel" role="region" aria-live="polite">
              <nav className="content-stage__menu" aria-label="Section navigation">
                <button type="button" className="content-stage__menu-home" onClick={() => router.push('/')}>Menu</button>
                <ul className="content-stage__menu-list">
                  {MENU_ITEMS.map((item) => {
                    const isActive = item.href === `/${primarySegment ?? ''}`;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleNestedNavigate(item.href)}
                          className={`content-stage__menu-item${isActive ? ' is-active' : ''}`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <article className="content-stage__body">{panelNode}</article>
            </section>
          </div>
        )}

        {isStandaloneView && isAdminView && (
          <div className="admin-stage" role="region" aria-live="polite">
            {children}
          </div>
        )}

        {detailNode && (
          <div className={`detail-stage${isDetailVisible ? ' is-visible' : ''}`} role="region" aria-live="polite">
            {detailNode}
          </div>
        )}
      </div>
    </>
  );
}
