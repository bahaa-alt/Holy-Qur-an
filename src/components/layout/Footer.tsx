import Link from "next/link";
import { Code2 } from "lucide-react";
import { OfflineBadge } from "./OfflineBadge";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Free, open-source, no accounts, no servers.{" "}
          <Link href="/about/" className="underline decoration-dotted underline-offset-2 hover:text-ink">
            Data &amp; licenses
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
            <Code2 size={14} /> Source
          </a>
        </div>
      </div>
    </footer>
  );
}
