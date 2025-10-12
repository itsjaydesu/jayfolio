"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/administratorrrr", label: "Content" },
  { href: "/administratorrrr/media", label: "Media Library" },
  { href: "/administratorrrr/settings", label: "Settings" }
];

function isActive(pathname, href) {
  if (href === "/administratorrrr") {
    return pathname === "/administratorrrr";
  }
  return pathname.startsWith(href);
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin sections">
      <div className="admin-nav__inner">
        <div className="admin-nav__label">
          <span className="admin-nav__label-dot" aria-hidden="true" />
          Console
        </div>
        <ul className="admin-nav__list">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href} className="admin-nav__item">
                <Link
                  href={link.href}
                  className={`admin-nav__link${active ? " is-active" : ""}`}
                >
                  <span className="admin-nav__link-text">{link.label}</span>
                  <span className="admin-nav__link-glow" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
