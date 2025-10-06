"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/admin", label: "Content" },
  { href: "/admin/media", label: "Media Library" },
  { href: "/admin/settings", label: "Settings" }
];

function isActive(pathname, href) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname.startsWith(href);
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin sections">
      <ul className="admin-nav__list">
        {NAV_LINKS.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <li key={link.href} className="admin-nav__item">
              <Link
                href={link.href}
                className={`admin-nav__link${active ? " is-active" : ""}`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
