"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { getTafsirMeta, getTafsirSurah } from "@/lib/data/loader";
import { EXTERNAL_TAFSIR_SOURCES, getExternalTafsirSurah, externalTafsirMeta } from "@/lib/tafsir/externalSources";
import { useT } from "@/lib/i18n/LanguageContext";
import type { TafsirMetaFile } from "@/lib/data/types";

const JALALAYN_SLUG = "jalalayn";

/** Local (shipped, coverage-tracked) first, then the three live-fetched sources. */
const SOURCES: readonly { slug: string; name: string; nameAr: string; external: boolean }[] = [
  { slug: JALALAYN_SLUG, name: "Tafsir al-Jalalayn", nameAr: "تفسير الجلالين", external: false },
  ...EXTERNAL_TAFSIR_SOURCES.map((s) => ({ slug: s.slug, name: s.name, nameAr: s.nameAr, external: true })),
];

/**
 * One verse's classical commentary, opened on demand, from a choice of four
 * sources: al-Jalalayn (shipped with the app, offline-capable) plus three
 * more fetched live from an external source when selected (see
 * lib/tafsir/externalSources.ts for why those three aren't bundled).
 *
 * The design decision that matters is what happens when there is no entry.
 * Al-Jalalayn separately treats 6,010 of the corpus's 6,236 verses; the 226
 * gaps are verses it does not gloss on their own (32 of them surah 55's
 * repeated refrain, annotated once). This panel says so explicitly for
 * those verses rather than showing the nearest preceding note, which would
 * attribute to al-Jalalayn a comment he did not make on that verse. The
 * three external sources get the same treatment without the precise count
 * (see TafsirMetaFile's comment for why that number isn't tracked for them).
 */
export function TafsirPanel({ s, a }: { s: number; a: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState(JALALAYN_SLUG);
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "ready"; text: string | null; meta: TafsirMetaFile }
    | { kind: "failed" }
  >({ kind: "idle" });

  const source = SOURCES.find((src) => src.slug === slug)!;

  async function load(nextSlug: string) {
    setState({ kind: "idle" });
    try {
      const isExternal = EXTERNAL_TAFSIR_SOURCES.some((src) => src.slug === nextSlug);
      const [meta, surah] = isExternal
        ? [externalTafsirMeta(nextSlug), await getExternalTafsirSurah(nextSlug, s)]
        : await Promise.all([getTafsirMeta(nextSlug), getTafsirSurah(nextSlug, s)]);
      setState({ kind: "ready", text: surah.entries.find((e) => e.a === a)?.t ?? null, meta });
    } catch {
      setState({ kind: "failed" });
    }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && state.kind === "idle") await load(slug);
  }

  async function selectSource(nextSlug: string) {
    if (nextSlug === slug) return;
    setSlug(nextSlug);
    await load(nextSlug);
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
          <div className="flex flex-wrap gap-1.5">
            {SOURCES.map((src) => (
              <button
                key={src.slug}
                type="button"
                onClick={() => selectSource(src.slug)}
                className={`arabic-ui rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  src.slug === slug
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted hover:border-accent hover:text-accent"
                }`}
              >
                {src.nameAr}
              </button>
            ))}
          </div>

          <div className="mt-3">
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
                {source.external && <p className="mt-1 text-xs text-muted/70">{t.tafsir.liveSourceNote}</p>}
                {state.text === null ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted/80">
                    {state.meta.coveredVerses !== undefined && state.meta.totalVerses !== undefined
                      ? t.tafsir.noEntry(state.meta.coveredVerses, state.meta.totalVerses)
                      : t.tafsir.noEntryUnknownTotal}
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
        </div>
      )}
    </div>
  );
}
