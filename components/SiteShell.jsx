'use client';

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
  description: 'Hover a channel to preview its dossier. Select to open the panel to the right.',
  mode: 'idle'
};

export default function SiteShell({ children }) {
  const pathname = usePathname();

  const activeItem = useMemo(() => MENU_ITEMS.find((item) => item.href === pathname), [pathname]);
  const activeSection = activeItem?.id ?? null;

  const activeStatus = activeItem
    ? { ...activeItem.status, mode: 'active' }
    : DEFAULT_STATUS;

  const [status, setStatus] = useState(activeStatus);

  useEffect(() => {
    setStatus(activeStatus);
  }, [activeStatus]);

  const canvasSection = activeSection ?? 'about';

  return (
    <>
      <SceneCanvas activeSection={canvasSection} />
      <div className="ui-overlay" aria-hidden="true">
        <h1>Hypnotic Field</h1>
        <p>Glide to tilt the waves. Tap for gentle ripples. Tune, randomize, or export every setting.</p>
      </div>
      <RetroMenu
        items={MENU_ITEMS}
        activeSection={activeSection}
        status={status}
        onStatusChange={setStatus}
        activeStatus={activeStatus}
      />
      <main className="content-region">
        <div className="content-panel">{children}</div>
      </main>
    </>
  );
}
