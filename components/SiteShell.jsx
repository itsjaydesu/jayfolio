'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
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
  description: 'Choose a channel to dive into its dossier. Hover to preview, click to enter.',
  mode: 'idle'
};

export default function SiteShell({ children }) {
  const pathname = usePathname();

  const pathSegments = useMemo(() => pathname?.split('/').filter(Boolean) ?? [], [pathname]);
  const primarySegment = pathSegments[0] ?? null;
  const activeItem = useMemo(
    () => MENU_ITEMS.find((item) => item.id === primarySegment) ?? null,
    [primarySegment]
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
            items={MENU_ITEMS}
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
          <header className="site-shell__header">
            <Link href="/" className="site-shell__brand">
              Jay Winder
            </Link>
            <nav className="site-shell__nav" aria-label="Primary navigation">
              {MENU_ITEMS.map((item) => {
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
            >
              @itsjaydesu
            </Link>
          </header>
          <p className="sr-only" aria-live="polite">
            {status.title}: {status.description}
          </p>
          <main
            key={pathname}
            className={`site-shell__main site-shell__transition${isDetailView ? ' is-detail' : ''}`}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
