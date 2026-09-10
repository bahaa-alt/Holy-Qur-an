import Link from "next/link";
import { BookMarked } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
          <BookMarked size={20} className="text-accent" />
          <span className="hidden sm:inline">Quran Root Research</span>
          <span className="sm:hidden">Roots</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/roots/"
            className="rounded-lg px-3 py-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            Roots
          </Link>
          <Link
            href="/compare/"
            className="rounded-lg px-3 py-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            Compare
          </Link>
          <Link
            href="/phrases/"
            className="rounded-lg px-3 py-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            Phrases
          </Link>
          <Link
            href="/about/"
            className="rounded-lg px-3 py-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            About
          </Link>
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
