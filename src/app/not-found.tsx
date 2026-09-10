"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";

export default function NotFound() {
  const t = useT();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <SearchX size={32} className="text-muted" />
      <h1 className="text-xl font-semibold text-ink">{t.notFound.title}</h1>
      <p className="text-sm text-muted">{t.notFound.message}</p>
      <Link href="/" className="mt-2 text-sm text-accent hover:text-accent-strong">
        {t.notFound.backToSearch}
      </Link>
    </div>
  );
}
