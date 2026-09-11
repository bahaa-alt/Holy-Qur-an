"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import type { NamePhraseDef } from "@/lib/names/namePhrases";

/**
 * The add/edit form for one Names Phrases entry -- same component either
 * way, just seeded with `initial` when editing. Only the Arabic phrase is
 * required; the label is a free-text gloss the list otherwise can't do
 * without, but leaving it blank is harmless (the pill just shows the
 * phrase alone).
 */
export function PhraseForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Pick<NamePhraseDef, "phraseAr" | "labelEn">;
  onSave: (phraseAr: string, labelEn: string) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [phraseAr, setPhraseAr] = useState(initial?.phraseAr ?? "");
  const [labelEn, setLabelEn] = useState(initial?.labelEn ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phraseAr.trim();
    if (!trimmed) return;
    onSave(trimmed, labelEn.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-bg p-3">
      <label className="flex flex-col gap-1 text-xs text-muted">
        {t.phraseForm.phraseLabel}
        <input
          type="text"
          value={phraseAr}
          onChange={(e) => setPhraseAr(e.target.value)}
          dir="rtl"
          autoFocus
          placeholder={t.phraseForm.phrasePlaceholder}
          className="arabic-ui w-40 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        {t.phraseForm.labelLabel}
        <input
          type="text"
          value={labelEn}
          onChange={(e) => setLabelEn(e.target.value)}
          placeholder={t.phraseForm.labelPlaceholder}
          className="w-56 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={phraseAr.trim() === ""}
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-accent-fg disabled:opacity-50"
        >
          {t.common.save}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-ink">
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
