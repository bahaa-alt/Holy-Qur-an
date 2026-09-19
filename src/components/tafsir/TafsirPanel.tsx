"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { getTafsirMeta, getTafsirSurah } from "@/lib/data/loader";
import { useT } from "@/lib/i18n/LanguageContext";
import type { TafsirMetaFile } from "@/lib/data/types";

const SLUG = "jalalayn";

/**
 * One verse's classical commentary, opened on demand.
 *
 * The design decision that matters is what happens when there is no entry.
 * Tafsir al-Jalalayn separately treats 6,010 of the corpus's 6,236 verses;
 * the 226 gaps are verses it does not gloss on their own (32 of them surah
 * 55's repeated refrain, annotated once). This panel says so explicitly for
 * those verses rather than showing the nearest preceding note, which would
 * attribute to al-Jalalayn a comment he did not make on that verse.
 */
export function TafsirPanel({ s, a }: { s: number; a: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "ready"; text: string | null; meta: TafsirMetaFile }
    | { kind: "failed" }
  >({ kind: "idle" });

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || state.kind !== "idle") return;

    try {
      const [meta, surah] = await Promise.all([getTafsirMeta(SLUG), getTafsirSurah(SLUG, s)]);
      setState({ kind: "ready", text: surah.entries.find((e) => e.a === a)?.t ?? null, meta });
    } catch {
      setState({ kind: "failed" });
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
      >
        <ChevronDown
          size={13}
          className={open ? "rotate-180 transition-transform" : "transition-transform"}
        />
        {t.tafsir.toggle}
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-border/70 p-3">
          {state.kind === "failed" ? (
            <p className="text-xs text-muted">{t.tafsir.failed}</p>
          ) : state.kind === "idle" ? (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Loader2 size={12} className="animate-spin" />
              {t.tafsir.loading}
            </p>
          ) : (
            <>
              <p className="text-xs text-muted">
                {state.meta.name}{" "}
                <bdi dir="rtl" lang="ar" className="arabic-ui">
                  {state.meta.nameAr}
                </bdi>
              </p>
              {state.text === null ? (
                <p className="mt-2 text-xs leading-relaxed text-muted/80">
                  {t.tafsir.noEntry(state.meta.coveredVerses, state.meta.totalVerses)}
                </p>
              ) : (
                <p className="arabic-ui mt-2 text-sm leading-loose text-ink" dir="rtl" lang="ar">
                  {state.text}
                </p>
              )}
              <p className="mt-3 border-t border-border/70 pt-2 text-xs leading-relaxed text-muted/70">
                {state.meta.authors}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
