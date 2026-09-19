"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { getMujamMeta, getMujamRoot } from "@/lib/data/loader";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import { MujamEntry } from "./MujamEntry";
import type { MujamMetaFile, MujamRootFile, MujamWork } from "@/lib/data/types";

/**
 * This root's articles from the three classical Arabic-Arabic lexicons,
 * opened on demand.
 *
 * Sits beside LanePanel rather than replacing it: Lane is the fullest
 * treatment in English and these are the works he himself compiled from, so
 * a reader of either language now has a lexicon in their own.
 *
 * Coverage differs per work and is stated rather than smoothed over --
 * Mufradāt is the narrowest at 1,410 of 1,651 roots, because it is a
 * lexicon of Qur'ānic vocabulary and not of the language at large. A root a
 * work does not cover is absent; nothing is substituted from a neighbouring
 * root, for the reason set out in build-mujam.ts.
 */
export function MujamPanel({ root }: { root: string }) {
  const t = useT();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<MujamWork["id"] | null>(null);
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "ready"; file: MujamRootFile | null; meta: MujamMetaFile }
    | { kind: "failed" }
  >({ kind: "idle" });

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || state.kind !== "idle") return;

    try {
      const meta = await getMujamMeta();
      if (meta.uncoveredRoots.includes(root)) {
        setState({ kind: "ready", file: null, meta });
        return;
      }
      const file = await getMujamRoot(root);
      setState({ kind: "ready", file, meta });
      setActive(file.entries[0]?.work ?? null);
    } catch {
      setState({ kind: "failed" });
    }
  }

  const file = state.kind === "ready" ? state.file : null;
  const meta = state.kind === "ready" ? state.meta : null;
  const entry = file?.entries.find((e) => e.work === active) ?? null;
  const work = meta?.works.find((w) => w.id === active) ?? null;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors hover:text-accent"
      >
        <ChevronDown
          size={14}
          className={open ? "rotate-180 transition-transform" : "transition-transform"}
        />
        {t.mujam.heading}
      </button>

      {open && (
        <div className="mt-4">
          {state.kind === "failed" ? (
            <p className="text-sm text-muted">{t.mujam.failed}</p>
          ) : state.kind === "idle" ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 size={13} className="animate-spin" />
              {t.mujam.loading}
            </p>
          ) : file === null || meta === null ? (
            <p className="text-sm leading-relaxed text-muted">
              {t.mujam.noEntry(meta?.coveredRoots ?? 0, meta?.totalRoots ?? 0)}
            </p>
          ) : (
            <>
              {/* One tab per work that covers THIS root, so a tab is never a
                  dead end. A work missing from the row is a work with no
                  article for this root. */}
              <div className="flex flex-wrap gap-2" role="tablist">
                {file.entries.map((e) => {
                  const w = meta.works.find((x) => x.id === e.work);
                  if (!w) return null;
                  const on = e.work === active;
                  return (
                    <button
                      key={e.work}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setActive(e.work)}
                      className={
                        on
                          ? "rounded-full border border-accent bg-accent/10 px-3 py-1 text-xs text-accent"
                          : "rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:text-ink"
                      }
                    >
                      <bdi dir="rtl" lang="ar" className="arabic-ui">
                        {w.title}
                      </bdi>
                    </button>
                  );
                })}
              </div>

              {entry && work && (
                <div className="mt-4">
                  <p className="text-xs leading-relaxed text-muted">
                    {lang === "ar" ? work.author : work.authorEn} —{" "}
                    {lang === "ar" ? work.note : work.noteEn}
                  </p>

                  {entry.spelling !== null && (
                    <p className="mt-2 text-xs text-muted">
                      {t.mujam.underSpelling}{" "}
                      <bdi dir="rtl" lang="ar" className="arabic-ui">
                        {entry.spelling}
                      </bdi>
                    </p>
                  )}

                  <div className="mt-3 space-y-4">
                    {entry.articles.map((article, i) => (
                      <article key={i}>
                        <h3 className="arabic-ui text-base text-accent" dir="rtl" lang="ar">
                          {article.headword}
                        </h3>
                        <MujamEntry tokens={article.tokens} />
                      </article>
                    ))}
                  </div>

                  {/* The edition, not just the title. A digital text nobody
                      can trace to a printed edition cannot be cited, which
                      is the whole reason these three were chosen. */}
                  <p className="mt-5 border-t border-border pt-3 text-xs leading-relaxed text-muted/70">
                    {lang === "ar" ? work.edition : work.editionEn}.{" "}
                    {t.mujam.coverage(work.coveredRoots, meta.totalRoots)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
