"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, RefreshCw, X } from "lucide-react";
import { getArIndex, getMeta } from "@/lib/data/loader";
import { globalIdToRef } from "@/lib/data/verseId";
import { findVersesContaining } from "@/lib/names/namePhrases";
import { addPhrase, getPhrases, removePhrase, resetToDefaults, updatePhrase } from "@/lib/names/namePhrasesStore";
import { PhraseForm } from "./PhraseForm";
import { PhraseDetail, type PhraseMatchRef } from "./PhraseDetail";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ArIndexFile, MetaFile } from "@/lib/data/types";
import type { NamePhraseDef } from "@/lib/names/namePhrases";

const PILL_CLASS = (active: boolean) =>
  `flex items-center gap-1.5 rounded-lg border py-1.5 ps-3 pe-1.5 text-sm transition-colors ${
    active ? "border-accent bg-accent/10 text-accent" : "border-border text-ink hover:border-accent hover:text-accent"
  }`;
const ICON_BUTTON_CLASS = "rounded p-0.5 text-muted hover:text-ink";

/** "new" = the add form; a slug = editing that phrase; null = neither shown. */
type FormState = "new" | string | null;

/**
 * Browses every verse containing one of a curated set of Allah-invoking
 * phrases anywhere in its text -- computed entirely client-side from
 * ar-index.json, same as VerseSimilarityTab's on-demand fetch pattern, no
 * dedicated build step needed. The phrase list itself is editable and
 * persisted in localStorage (see namePhrasesStore.ts): the curated
 * NAME_PHRASES defaults until the first add/edit/remove, after which the
 * stored list takes over entirely.
 */
export function PhrasesTab() {
  const t = useT();
  const [arIndex, setArIndex] = useState<ArIndexFile | null>(null);
  const [meta, setMeta] = useState<MetaFile | null>(null);
  const [phrases, setPhrases] = useState<NamePhraseDef[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getArIndex(), getMeta()]).then(([ai, m]) => {
      if (!cancelled) {
        setArIndex(ai);
        setMeta(m);
      }
    });
    // One-time hydration from localStorage (unavailable during SSR/static
    // export, so the initial render always shows the curated defaults) --
    // not a subscription.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhrases(getPhrases());
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPhrase = phrases.find((p) => p.slug === selectedSlug) ?? null;

  const matches: PhraseMatchRef[] = useMemo(() => {
    if (!arIndex || !meta || !selectedPhrase) return [];
    return findVersesContaining(selectedPhrase.phraseAr, arIndex).flatMap((m) => {
      const ref = globalIdToRef(meta, m.globalId);
      return ref ? [{ s: ref.s, a: ref.a, startW: m.startW, endW: m.endW }] : [];
    });
  }, [arIndex, meta, selectedPhrase]);

  const surahMetaByNum = useMemo(() => new Map(meta?.surahs.map((s) => [s.n, s]) ?? []), [meta]);
  const loading = !arIndex || !meta;

  function handleAdd(phraseAr: string, labelEn: string) {
    setPhrases(addPhrase(phraseAr, labelEn));
    setFormState(null);
  }

  function handleUpdate(slug: string, phraseAr: string, labelEn: string) {
    setPhrases(updatePhrase(slug, phraseAr, labelEn));
    setFormState(null);
  }

  function handleRemove(slug: string) {
    setPhrases(removePhrase(slug));
    if (selectedSlug === slug) setSelectedSlug(null);
    if (formState === slug) setFormState(null);
  }

  function handleReset() {
    setPhrases(resetToDefaults());
    setSelectedSlug(null);
    setFormState(null);
  }

  return (
    <div>
      <p className="text-sm text-muted">{t.namePhrasesTab.description}</p>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.namePhrasesTab.loading}
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {phrases.map((phrase) => (
              <div key={phrase.slug} className={PILL_CLASS(selectedSlug === phrase.slug)}>
                <button
                  type="button"
                  onClick={() => setSelectedSlug((prev) => (prev === phrase.slug ? null : phrase.slug))}
                  className="flex items-center gap-2"
                >
                  <span className="arabic-ui">{phrase.phraseAr}</span>
                  <span className="text-xs text-muted">{phrase.labelEn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormState((prev) => (prev === phrase.slug ? null : phrase.slug))}
                  aria-label={t.namePhrasesTab.editAria(phrase.phraseAr)}
                  className={ICON_BUTTON_CLASS}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(phrase.slug)}
                  aria-label={t.namePhrasesTab.removeAria(phrase.phraseAr)}
                  className={ICON_BUTTON_CLASS}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormState((prev) => (prev === "new" ? null : "new"))}
              className="rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-accent"
            >
              {t.namePhrasesTab.addPhrase}
            </button>
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-muted hover:text-ink"
            >
              <RefreshCw size={12} /> {t.namePhrasesTab.resetToDefaults}
            </button>
          </div>

          {formState === "new" && (
            <div className="mt-3">
              <PhraseForm onSave={handleAdd} onCancel={() => setFormState(null)} />
            </div>
          )}
          {formState !== null && formState !== "new" && (
            <div className="mt-3">
              <PhraseForm
                initial={phrases.find((p) => p.slug === formState)}
                onSave={(phraseAr, labelEn) => handleUpdate(formState, phraseAr, labelEn)}
                onCancel={() => setFormState(null)}
              />
            </div>
          )}

          <div className="mt-4 border-t border-border pt-4">
            {!selectedPhrase ? (
              <p className="text-sm text-muted">{t.namePhrasesTab.pickPrompt}</p>
            ) : matches.length === 0 ? (
              <p className="text-sm text-muted">{t.namePhrasesTab.noResults}</p>
            ) : (
              // Keyed by slug *and* text: editing the currently-selected
              // phrase's text must remount this (fresh fetch), not just
              // switching which phrase is selected.
              <PhraseDetail
                key={`${selectedPhrase.slug}:${selectedPhrase.phraseAr}`}
                matches={matches}
                surahMetaByNum={surahMetaByNum}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
