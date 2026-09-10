"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { getSavedItems, removeItem, updateNote } from "@/lib/notes/store";
import { CopyTextButton } from "@/components/export/CopyTextButton";
import { useT } from "@/lib/i18n/LanguageContext";
import type { SavedItem, SavedKind } from "@/lib/notes/types";

const KIND_ORDER: SavedKind[] = ["root", "word", "verse"];

function buildMarkdown(items: readonly SavedItem[]): string {
  return items.map((i) => `- [${i.label}](${i.href})${i.note ? `\n  ${i.note}` : ""}`).join("\n");
}

export function SavedList() {
  const t = useT();
  const kindLabels: Record<SavedKind, string> = {
    root: t.savedList.rootsHeading,
    word: t.savedList.wordsHeading,
    verse: t.savedList.versesHeading,
  };
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // One-time hydration from localStorage (unavailable during SSR/static
    // export, so the initial render is always empty) -- not a subscription.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getSavedItems());
    setLoaded(true);
  }, []);

  function handleRemove(id: string) {
    removeItem(id);
    setItems(getSavedItems());
  }

  function handleNoteChange(id: string, note: string) {
    updateNote(id, note);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, note } : i)));
  }

  if (!loaded) return null;

  if (items.length === 0) {
    return <p className="text-sm text-muted">{t.savedList.empty}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CopyTextButton text={buildMarkdown(items)} />
      </div>

      {KIND_ORDER.filter((kind) => items.some((i) => i.kind === kind)).map((kind) => (
        <div key={kind}>
          <h2 className="text-sm font-medium text-ink">{kindLabels[kind]}</h2>
          <div className="mt-3 space-y-3">
            {items
              .filter((i) => i.kind === kind)
              .map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={item.href}
                      className="arabic-ui text-sm font-medium text-accent hover:text-accent-strong"
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      aria-label={t.savedList.removeAria(item.label)}
                      className="text-muted hover:text-ink"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <textarea
                    value={item.note}
                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                    placeholder={t.savedList.notePlaceholder}
                    rows={2}
                    className="mt-2 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
