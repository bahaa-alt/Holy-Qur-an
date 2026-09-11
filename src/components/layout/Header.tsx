"use client";

import Link from "next/link";
import { BookMarked } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

const NAV_LINK_CLASS = "rounded-lg px-3 py-1.5 text-muted transition-colors hover:bg-surface hover:text-ink";

export function Header() {
  const t = useT();

  return (
    <header className="print:hidden sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
          <BookMarked size={20} className="text-accent" />
          <span className="hidden sm:inline">{t.nav.logoFull}</span>
          <span className="sm:hidden">{t.nav.logoShort}</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <Link href="/quran/" className={NAV_LINK_CLASS}>
            {t.nav.quran}
          </Link>
          <Link href="/roots/" className={NAV_LINK_CLASS}>
            {t.nav.roots}
          </Link>
          <Link href="/search/" className={NAV_LINK_CLASS}>
            {t.nav.search}
          </Link>
          <Link href="/topics/" className={NAV_LINK_CLASS}>
            {t.nav.topics}
          </Link>
          <Link href="/names/" className={NAV_LINK_CLASS}>
            {t.nav.names}
          </Link>
          <Link href="/insights/" className={NAV_LINK_CLASS}>
            {t.nav.insights}
          </Link>
          <Link href="/saved/" className={NAV_LINK_CLASS}>
            {t.nav.saved}
          </Link>
          <Link href="/about/" className={NAV_LINK_CLASS}>
            {t.nav.about}
          </Link>
          <div className="ms-1 flex items-center gap-1.5">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
