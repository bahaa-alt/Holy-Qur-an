"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { getLaneMeta, getLaneRoot } from "@/lib/data/loader";
import { useT } from "@/lib/i18n/LanguageContext";
import { LaneEntry } from "./LaneEntry";
import type { LaneMetaFile, LaneRootFile } from "@/lib/data/types";

const MAX_SHOWN = 12;

/**
 * This root's article from Lane's Lexicon, opened on demand.
 *
 * Coverage is partial: Lane has an article for 1,617 of this corpus's 1,651
 * roots. He died in 1876 having published through roughly ق/ك, and the
 * remainder was assembled posthumously from his notes -- 26 of the 34 gaps
 * fall in ك-ي. A root he does not cover says so; nothing is substituted from
 * a near-matching root, because a near match is a different root.
 */
export function LanePanel({ root }: { root: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "ready"; file: LaneRootFile | null; meta: LaneMetaFile }
    | { kind: "failed" }
  >({ kind: "idle" });
  const [showAll, setShowAll] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || state.kind !== "idle") return;

    try {
      const meta = await getLaneMeta();
      if (meta.uncoveredRoots.includes(root)) {
        setState({ kind: "ready", file: null, meta });
        return;
      }
      setState({ kind: "ready", file: await getLaneRoot(root), meta });
    } catch {
      setState({ kind: "failed" });
    }
  }

  const articles = state.kind === "ready" && state.file ? state.file.articles : [];
  const shown = showAll ? articles : articles.slice(0, MAX_SHOWN);

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
        {t.lane.heading}
      </button>

      {open && (
        <div className="mt-4">
          {state.kind === "failed" ? (
            <p className="text-sm text-muted">{t.lane.failed}</p>
          ) : state.kind === "idle" ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 size={13} className="animate-spin" />
              {t.lane.loading}
            </p>
          ) : state.file === null ? (
            <p className="text-sm leading-relaxed text-muted">
              {t.lane.noEntry(state.meta.coveredRoots, state.meta.totalRoots)}
            </p>
          ) : (
            <>
              {/* Lane defines in English; there is no Arabic edition to swap
                  in. Saying so beats dropping an Arabic-mode reader into
                  English prose with no explanation. */}
              {t.lane.englishWork !== "" && (
                <p className="mb-3 rounded-md border border-border/70 bg-bg/40 p-2 text-xs leading-relaxed text-muted">
                  {t.lane.englishWork}
                </p>
              )}
              {state.file.laneRoot !== root && (
                <p className="mb-3 text-xs text-muted">
                  {t.lane.underSpelling}{" "}
                  <bdi dir="rtl" lang="ar" className="arabic-ui">
                    {state.file.laneRoot}
                  </bdi>
                </p>
              )}
              <div className="space-y-4">
                {shown.map((article, i) => (
                  <article key={i}>
                    <h3 className="arabic-ui text-base text-accent" dir="rtl" lang="ar">
                      {article.headword}
                    </h3>
                    <LaneEntry tokens={article.tokens} />
                  </article>
                ))}
              </div>
              {articles.length > shown.length && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-4 text-sm text-accent hover:text-accent-strong"
                >
                  {t.lane.showAll(articles.length)}
                </button>
              )}
              <p className="mt-5 border-t border-border pt-3 text-xs leading-relaxed text-muted/70">
                {state.meta.name} — {state.meta.author}.{" "}
                {t.lane.coverage(state.meta.coveredRoots, state.meta.totalRoots)}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
