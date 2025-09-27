'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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

const PANEL_TRANSITION_MS = 420;
const DETAIL_TRANSITION_MS = 480;

const TRANSITION_PHASES = {
  PANEL: 'panel',
  PANEL_TO_DETAIL: 'panel-to-detail',
  DETAIL: 'detail',
  DETAIL_TO_PANEL: 'detail-to-panel',
  HIDDEN: 'hidden'
};

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

  const initialPhase = isAdminView
    ? TRANSITION_PHASES.HIDDEN
    : isDetailView
      ? TRANSITION_PHASES.DETAIL
      : isContentActive
        ? TRANSITION_PHASES.PANEL
        : TRANSITION_PHASES.HIDDEN;

  const initialPanelContent = !isStandaloneView && isContentActive ? children : null;
  const initialDetailContent = isDetailView ? children : null;

  const [status, setStatus] = useState(activeStatus);
  const [transitionPhase, setTransitionPhase] = useState(initialPhase);
  const [panelContent, setPanelContent] = useState(initialPanelContent);
  const [detailContent, setDetailContent] = useState(initialDetailContent);
  const transitionTimerRef = useRef(null);
  const previousStateRef = useRef({ isDetailView, isAdminView, isContentActive });
  const isDetailViewRef = useRef(isDetailView);

  useEffect(() => {
    setStatus(activeStatus);
  }, [activeStatus]);

  useLayoutEffect(() => {
    isDetailViewRef.current = isDetailView;
  }, [isDetailView]);

  useLayoutEffect(() => {
    if (isAdminView || isDetailView) return;
    if (!isContentActive) {
      setPanelContent(null);
      return;
    }
    setPanelContent(children);
  }, [children, isAdminView, isContentActive, isDetailView]);

  useLayoutEffect(() => {
    if (isDetailView) {
      setDetailContent(children);
    }
  }, [children, isDetailView]);

  useLayoutEffect(() => {
    const prev = previousStateRef.current;
    previousStateRef.current = { isDetailView, isAdminView, isContentActive };

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    if (isAdminView) {
      setTransitionPhase(TRANSITION_PHASES.HIDDEN);
      setPanelContent(null);
      setDetailContent(null);
      return;
    }

    if (!prev.isDetailView && isDetailView) {
      setTransitionPhase(panelContent ? TRANSITION_PHASES.PANEL_TO_DETAIL : TRANSITION_PHASES.DETAIL);
      transitionTimerRef.current = setTimeout(() => {
        setTransitionPhase(TRANSITION_PHASES.DETAIL);
        setPanelContent(null);
        transitionTimerRef.current = null;
      }, DETAIL_TRANSITION_MS);
      return;
    }

    if (prev.isDetailView && !isDetailView) {
      const nextPhase = isContentActive ? TRANSITION_PHASES.DETAIL_TO_PANEL : TRANSITION_PHASES.HIDDEN;
      setTransitionPhase(nextPhase);
      const duration = isContentActive ? PANEL_TRANSITION_MS : DETAIL_TRANSITION_MS;
      transitionTimerRef.current = setTimeout(() => {
        const stillDetail = isDetailViewRef.current;
        if (!stillDetail) {
          setDetailContent(null);
        }
        setTransitionPhase(stillDetail ? TRANSITION_PHASES.DETAIL : isContentActive ? TRANSITION_PHASES.PANEL : TRANSITION_PHASES.HIDDEN);
        transitionTimerRef.current = null;
      }, duration);
      return;
    }

    if (isDetailView) {
      setTransitionPhase(TRANSITION_PHASES.DETAIL);
      return;
    }

    if (isContentActive && panelContent) {
      setTransitionPhase(TRANSITION_PHASES.PANEL);
    } else {
      if (!isContentActive) {
        setPanelContent(null);
      }
      setDetailContent(null);
      setTransitionPhase(TRANSITION_PHASES.HIDDEN);
    }
  }, [isAdminView, isContentActive, isDetailView, panelContent]);

  useEffect(() => () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
  }, []);

  const canvasSection = activeSection ?? 'about';
  const showOverlay = !isContentActive && !isStandaloneView;
  const shouldRenderCanvas = !isAdminView;
  const isCanvasPaused = transitionPhase !== TRANSITION_PHASES.HIDDEN;

  const panelIsActive =
    transitionPhase === TRANSITION_PHASES.PANEL ||
    transitionPhase === TRANSITION_PHASES.PANEL_TO_DETAIL ||
    transitionPhase === TRANSITION_PHASES.DETAIL_TO_PANEL;
  const panelIsInteractive =
    transitionPhase === TRANSITION_PHASES.PANEL || transitionPhase === TRANSITION_PHASES.DETAIL_TO_PANEL;
  const detailIsActive =
    transitionPhase === TRANSITION_PHASES.DETAIL ||
    transitionPhase === TRANSITION_PHASES.PANEL_TO_DETAIL ||
    transitionPhase === TRANSITION_PHASES.DETAIL_TO_PANEL;

  const shouldRenderPanelStage =
    panelContent !== null ||
    transitionPhase === TRANSITION_PHASES.PANEL_TO_DETAIL ||
    transitionPhase === TRANSITION_PHASES.DETAIL_TO_PANEL;
  const shouldRenderDetailStage =
    detailContent !== null ||
    transitionPhase === TRANSITION_PHASES.PANEL_TO_DETAIL ||
    transitionPhase === TRANSITION_PHASES.DETAIL_TO_PANEL ||
    transitionPhase === TRANSITION_PHASES.DETAIL;

  const panelClassName = `content-stage${panelIsActive ? ' is-active' : ''}${
    transitionPhase === TRANSITION_PHASES.PANEL_TO_DETAIL ? ' is-fading-out' : ''
  }${transitionPhase === TRANSITION_PHASES.DETAIL_TO_PANEL ? ' is-fading-in' : ''}`;
  const detailClassName = `detail-stage${detailIsActive ? ' is-visible' : ''}${
    transitionPhase === TRANSITION_PHASES.PANEL_TO_DETAIL ? ' is-fading-in' : ''
  }${transitionPhase === TRANSITION_PHASES.DETAIL_TO_PANEL ? ' is-fading-out' : ''}`;

  const showCurtain =
    transitionPhase === TRANSITION_PHASES.PANEL_TO_DETAIL || transitionPhase === TRANSITION_PHASES.DETAIL_TO_PANEL;
  const curtainClassName = `transition-curtain${showCurtain ? ' is-visible' : ''}`;

  const handleStatusChange = useCallback((next) => {
    setStatus(next);
  }, []);

  const handleMenuReset = useCallback(() => {
    setStatus(activeStatus);
  }, [activeStatus]);

  const handleBackdropDismiss = useCallback(() => {
    if (!panelIsInteractive) return;
    if (!isContentActive) return;
    router.push('/');
  }, [isContentActive, panelIsInteractive, router]);

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
        <div className={curtainClassName} aria-hidden={!showCurtain} />
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

        {shouldRenderPanelStage && (
          <div className={panelClassName} aria-hidden={!panelIsActive}>
            <button
              type="button"
              className="content-stage__backdrop"
              aria-hidden={!panelIsInteractive}
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
              <article className="content-stage__body">{panelContent}</article>
            </section>
          </div>
        )}

        {isStandaloneView && isAdminView && (
          <div className="admin-stage" role="region" aria-live="polite">
            {children}
          </div>
        )}

        {shouldRenderDetailStage && (
          <div className={detailClassName} role="region" aria-live="polite" aria-hidden={!detailIsActive}>
            {isDetailView ? children : detailContent}
          </div>
        )}
      </div>
    </>
  );
}
