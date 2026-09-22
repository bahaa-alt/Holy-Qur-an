"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { getTreebankSurah } from "@/lib/data/loader";
import { relLabelEn } from "@/lib/treebank/relLabels";
import { useT } from "@/lib/i18n/LanguageContext";
import type { TreebankEntry } from "@/lib/data/types";

type State =
  | { kind: "idle" }
  | { kind: "ready"; segments: TreebankEntry[]; headText: Map<string, string>; hasElided: boolean }
  | { kind: "failed" };

/**
 * One verse's traditional grammatical dependency (iʿrāb): each word-segment
 * with the relation it carries to its head, from a third-party treebank
 * joined onto this app's own segment addressing (see build-treebank.ts).
 *
 * Loaded on demand, one surah per open, matching TafsirPanel/ReadingsPanel.
 * `headText` is built from the WHOLE surah's entries, not just this verse's
 * -- a dependency can cross a verse boundary within the same surah (a
 * clause continuing past a pause mark), so the head a segment names is not
 * always among this verse's own entries.
 */
export function TreebankPanel({ s, a }: { s: number; a: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || state.kind !== "idle") return;

    try {
      const file = await getTreebankSurah(s);
      const headText = new Map<string, string>();
      for (const e of file.entries) headText.set(`${e.a}:${e.w}:${e.g}`, e.t);
      const segments = file.entries
        .filter((e) => e.a === a)
        .sort((x, y) => x.w - y.w || x.g - y.g);
      setState({ kind: "ready", segments, headText, hasElided: file.elidedAyahs.includes(a) });
    } catch {
      setState({ kind: "failed" });
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void toggle()}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
      >
        <ChevronDown
          size={13}
          className={open ? "rotate-180 transition-transform" : "transition-transform"}
        />
        {t.treebank.toggle}
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-border/70 p-3">
          {state.kind === "failed" ? (
            <p className="text-xs text-muted">{t.treebank.failed}</p>
          ) : state.kind === "idle" ? (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Loader2 size={12} className="animate-spin" />
              {t.treebank.loading}
            </p>
          ) : state.segments.length === 0 ? (
            <p className="text-xs text-muted">{t.treebank.noEntry}</p>
          ) : (
            <>
              <div className="space-y-1.5">
                {state.segments.map((seg) => {
                  const headLabel = seg.head ? state.headText.get(seg.head) : undefined;
                  return (
                    <div
                      key={`${seg.w}:${seg.g}`}
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
                    >
                      <span className="arabic-ui text-ink" dir="rtl" lang="ar">
                        {seg.t}
                      </span>
                      <span className="text-xs text-muted">
                        {relLabelEn(seg.rel)}
                        {" · "}
                        <bdi dir="rtl" lang="ar" className="arabic-ui">
                          {seg.relAr}
                        </bdi>
                      </span>
                      {headLabel && (
                        <span className="text-xs text-muted/70">
                          {t.treebank.dependsOn}{" "}
                          <bdi dir="rtl" lang="ar" className="arabic-ui">
                            {headLabel}
                          </bdi>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {state.hasElided && <p className="mt-3 text-xs text-muted/70">{t.treebank.elidedNote}</p>}
              <p className="mt-3 border-t border-border/70 pt-2 text-xs leading-relaxed text-muted/70">
                {t.treebank.sourceNote}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
