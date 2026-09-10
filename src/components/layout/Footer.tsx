"use client";

import Link from "next/link";
import { Code2 } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";
import { OfflineBadge } from "./OfflineBadge";

export function Footer() {
  const t = useT();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {t.footer.tagline}{" "}
          <Link href="/about/" className="underline decoration-dotted underline-offset-2 hover:text-ink">
            {t.footer.dataAndLicenses}
          </Link>
        </p>
        <div className="flex items-center gap-3">
          <OfflineBadge />
          <a
            href="https://github.com/bahaa-alt/Holy-Qur-an"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-ink"
          >
            <Code2 size={14} /> {t.footer.source}
          </a>
        </div>
      </div>
    </footer>
  );
}
