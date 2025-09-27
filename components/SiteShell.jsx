'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  description: 'Hover a channel to preview its dossier. Select to open the panel to the right.',
  mode: 'idle'
};

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeItem = useMemo(() => MENU_ITEMS.find((item) => item.href === pathname), [pathname]);
  const activeSection = activeItem?.id ?? null;

  const activeStatus = useMemo(
    () => (activeItem ? { ...activeItem.status, mode: 'active' } : DEFAULT_STATUS),
    [activeItem]
  );

  const [status, setStatus] = useState(activeStatus);

  useEffect(() => {
    setStatus(activeStatus);
    setIsMenuOpen(false);
  }, [activeStatus]);

  const canvasSection = activeSection ?? 'about';

  const handleStatusChange = useCallback((next) => {
    setStatus(next);
  }, []);

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((value) => !value);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <>
      <SceneCanvas activeSection={canvasSection} />
      <div className="site-chrome">
        <header className="site-header">
          <div className="site-header__meta">
            <span className="badge badge--soft">Jay Winder</span>
            <h1>Hypnotic Field</h1>
            <p>Glide to tilt the waves. Tap for gentle ripples. Tune, randomize, or export every setting.</p>
          </div>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={isMenuOpen}
            aria-controls="retro-menu"
            onClick={handleMenuToggle}
          >
            {isMenuOpen ? 'Close Menu' : 'Open Menu'}
          </button>
        </header>

        <div className="site-grid">
          <RetroMenu
            id="retro-menu"
            items={MENU_ITEMS}
            activeSection={activeSection}
            status={status}
            activeStatus={activeStatus}
            onStatusChange={handleStatusChange}
            isOpen={isMenuOpen}
            onNavigate={handleCloseMenu}
          />
          <main className="content-region" id="content" tabIndex={-1} aria-live="polite">
            <article className="content-surface">{children}</article>
          </main>
        </div>
      </div>
      <button
        type="button"
        className={`nav-backdrop${isMenuOpen ? ' is-visible' : ''}`}
        aria-hidden={!isMenuOpen}
        tabIndex={-1}
        onClick={handleCloseMenu}
      />
    </>
  );
}
