"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import type { SurahMeta } from "@/lib/data/types";

export function SurahPageChrome({
  n,
  surahMeta,
  children,
}: {
  n: number;
  surahMeta: SurahMeta;
  children: ReactNode;
}) {
  const t = useT();
  const { lang } = useLanguage();
  // "Previous"/"Next" point toward the reading-start/-end surah number,
  // which is visually left/right in LTR but flips in RTL -- same reasoning
  // as Pagination's chevrons.
  const PrevIcon = lang === "ar" ? ArrowRight : ArrowLeft;
  const NextIcon = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between text-sm">
        {n > 1 ? (
          <Link
            href={`/surah/${n - 1}/`}
            className="inline-flex items-center gap-1 text-accent hover:text-accent-strong"
          >
            <PrevIcon size={14} /> {t.surahPage.previous}
          </Link>
        ) : (
          <span />
        )}
        {n < 114 ? (
          <Link
            href={`/surah/${n + 1}/`}
            className="inline-flex items-center gap-1 text-accent hover:text-accent-strong"
          >
            {t.surahPage.next} <NextIcon size={14} />
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {t.surahPage.summary(
            n,
            surahMeta.type === "meccan" ? t.surahPage.meccan : t.surahPage.medinan,
            surahMeta.ayahs,
          )}
        </p>
        <h1 className="arabic-ui mt-1 text-3xl font-semibold text-ink">{surahMeta.nameAr}</h1>
        <p className="text-sm text-muted">
          {surahMeta.translit} — {surahMeta.nameEn}
        </p>
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}
