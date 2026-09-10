"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AyahActions } from "@/components/ayah/AyahActions";
import { RelatedVerses } from "@/components/ayah/RelatedVerses";
import type { SurahMeta, SurahVerse } from "@/lib/data/types";

export function SurahVerseList({ surahMeta, verses }: { surahMeta: SurahMeta; verses: SurahVerse[] }) {
  const searchParams = useSearchParams();
  const focusedAyah = Number(searchParams.get("ayah") ?? "");
  const refs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!focusedAyah) return;
    const el = refs.current.get(focusedAyah);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusedAyah]);

  return (
    <div className="space-y-4">
      {verses.map((verse) => {
        const isFocused = verse.a === focusedAyah;
        return (
          <div
            key={verse.a}
            ref={(el) => {
              if (el) refs.current.set(verse.a, el);
            }}
            className={`rounded-xl border p-5 transition-colors ${
              isFocused ? "border-accent bg-accent/5" : "border-border bg-surface"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-muted">
                {surahMeta.n}:{verse.a}
              </span>
            </div>
            <p className="uthmani mt-2 text-ink">{verse.w.join(" ")}</p>
            <p className="mt-2 text-sm text-muted">{verse.t}</p>
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <AyahActions arabic={verse.w.join(" ")} translation={verse.t} surah={surahMeta.n} ayah={verse.a} />
              <RelatedVerses s={surahMeta.n} a={verse.a} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
