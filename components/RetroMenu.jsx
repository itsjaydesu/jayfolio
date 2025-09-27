'use client';

import Link from 'next/link';

export default function RetroMenu({ items, activeSection, status, onStatusChange, activeStatus }) {
  const handleRestore = () => {
    if (onStatusChange) {
      onStatusChange(activeStatus);
    }
  };

  return (
    <nav className="retro-menu" aria-label="Main navigation">
      <div className="retro-menu__titlebar">
        <span>
          <span className="indicator" aria-hidden="true" /> Jay Winder
        </span>
        <small>v4.1</small>
      </div>
      <div className="retro-menu__body">
        <ul className="retro-menu__list">
          {items.map((item) => {
            const isActive = item.id === activeSection;
            const handlePreview = () => {
              if (!onStatusChange) return;
              onStatusChange({ ...item.status, mode: isActive ? 'active' : 'preview' });
            };

            return (
              <li key={item.id} className={`retro-menu__item${isActive ? ' is-active' : ''}`} data-section={item.id}>
                <Link
                  href={item.href}
                  className="retro-menu__button"
                  onMouseEnter={handlePreview}
                  onMouseLeave={handleRestore}
                  onFocus={handlePreview}
                  onBlur={handleRestore}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="retro-menu__status" aria-live="polite">
        <strong>{status.title}</strong>
        <em>{status.description}</em>
        <span>{status.mode}</span>
      </p>
    </nav>
  );
}
