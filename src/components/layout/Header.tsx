"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, Menu, X } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

const NAV_LINK_CLASS = "rounded-lg px-3 py-1.5 text-muted transition-colors hover:bg-surface hover:text-ink";
const NAV_LINK_CLASS_ACTIVE = "rounded-lg px-3 py-1.5 bg-accent text-accent-fg";
const NAV_LINK_CLASS_MOBILE =
  "block rounded-lg px-3 py-2.5 text-muted transition-colors hover:bg-surface hover:text-ink";
const NAV_LINK_CLASS_MOBILE_ACTIVE = "block rounded-lg px-3 py-2.5 bg-accent text-accent-fg";

/**
 * A detail page's own URL doesn't start with its section's nav href (e.g.
 * /root/علم/ vs the "Roots" link's /roots/), so exact-match alone would
 * leave the nav with no active state on exactly the deep-link pages where
 * orientation matters most. These are the sections whose detail routes
 * live under a different top-level segment.
 */
const SECTION_ALIASES: Record<string, string[]> = {
  "/quran/": ["/surah/", "/v/"],
  "/roots/": ["/root/", "/word/"],
  "/search/": ["/query/", "/phrases/", "/compare/"],
  "/insights/": ["/curiosities/"],
};

function isActiveLink(pathname: string, href: string): boolean {
  if (pathname === href || pathname.startsWith(href)) return true;
  return (SECTION_ALIASES[href] ?? []).some((prefix) => pathname.startsWith(prefix));
}

/**
 * The nav links, without their toggles: shared between the desktop row and
 * the mobile drawer so the two never drift out of sync.
 *
 * Below `md:`, the link list used to just flex-wrap into 3-4 rows, which at
 * phone width ate ~17% of the viewport before any page content and (worse)
 * overlapped in-page text once scrolled, because the sticky header's real
 * height never matched what the wrap produced. It now collapses behind a
 * menu button instead of reflowing in place.
 */
export function Header() {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Closes on navigation, not on Link click -- adjusted during render
  // (React's documented pattern for resetting state when a prop changes)
  // rather than in an effect, so there is no extra render after the one
  // that already has to happen for the new pathname.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  const links = [
    { href: "/quran/", label: t.nav.quran },
    { href: "/roots/", label: t.nav.roots },
    { href: "/search/", label: t.nav.search },
    { href: "/topics/", label: t.nav.topics },
    { href: "/names/", label: t.nav.names },
    { href: "/syntax/", label: t.nav.syntax },
    { href: "/insights/", label: t.nav.insights },
    { href: "/saved/", label: t.nav.saved },
    { href: "/studies/", label: t.nav.studies },
    { href: "/about/", label: t.nav.about },
  ];

  return (
    <header className="print:hidden sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
          <BookMarked size={20} className="text-accent" />
          <span className="hidden sm:inline">{t.nav.logoFull}</span>
          <span className="sm:hidden">{t.nav.logoShort}</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActiveLink(pathname, l.href) ? "page" : undefined}
              className={isActiveLink(pathname, l.href) ? NAV_LINK_CLASS_ACTIVE : NAV_LINK_CLASS}
            >
              {l.label}
            </Link>
          ))}
          <div className="ms-1 flex items-center gap-1.5">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </nav>

        <div className="flex items-center gap-1.5 md:hidden">
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent hover:text-accent"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border px-2 py-2 text-sm md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActiveLink(pathname, l.href) ? "page" : undefined}
              className={
                isActiveLink(pathname, l.href) ? NAV_LINK_CLASS_MOBILE_ACTIVE : NAV_LINK_CLASS_MOBILE
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
