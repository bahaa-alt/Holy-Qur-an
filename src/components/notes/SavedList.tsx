"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, Download, Trash2, Upload } from "lucide-react";
import { exportSaved, getSavedItems, importSaved, removeItem, updateNote } from "@/lib/notes/store";
import { CopyTextButton } from "@/components/export/CopyTextButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LanguageContext";
import type { SavedItem, SavedKind } from "@/lib/notes/types";

const KIND_ORDER: SavedKind[] = ["root", "word", "verse", "query", "view"];

function buildMarkdown(items: readonly SavedItem[]): string {
  return items
    .map(
      (i) =>
        `- [${i.label}](${i.href})${i.detail ? ` — ${i.detail}` : ""}${i.note ? `\n  ${i.note}` : ""}`,
    )
    .join("\n");
}

/**
 * The notebook: everything saved, with its notes, and a way out.
 *
 * Export and import are not conveniences here. Saves live in
 * localStorage, which is per-browser, per-device, and gone the moment
 * someone clears site data -- so the file is the only durable copy of a
 * researcher's own work, and the only way it reaches their laptop from
 * their phone.
 */
export function SavedList() {
  const t = useT();
  const kindLabels: Record<SavedKind, string> = {
    root: t.savedList.rootsHeading,
    word: t.savedList.wordsHeading,
    verse: t.savedList.versesHeading,
    query: t.savedList.queriesHeading,
    view: t.savedList.viewsHeading,
  };
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  function handleExport() {
    const blob = new Blob([exportSaved()], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quran-notebook-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    try {
      const result = importSaved(await file.text());
      setItems(getSavedItems());
      setMessage(t.savedList.importSummary(result.added, result.updated, result.skipped));
    } catch {
      setMessage(t.savedList.importFailed);
    }
  }

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {items.length > 0 && <CopyTextButton text={buildMarkdown(items)} />}
        {items.length > 0 && (
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <Download size={13} /> {t.savedList.exportAll}
          </button>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Upload size={13} /> {t.savedList.importLabel}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = "";
          }}
        />
      </div>

      {message && <p className="text-end text-xs text-muted">{message}</p>}

      {items.length === 0 ? (
        <EmptyState icon={Bookmark} title={t.savedList.emptyTitle} description={t.savedList.empty} />
      ) : (
        KIND_ORDER.filter((kind) => items.some((i) => i.kind === kind)).map((kind) => (
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
                        className={`text-sm font-medium text-accent hover:text-accent-strong ${
                          // A query is a line of QCQL: it reads left to
                          // right in a monospace face, unlike a root.
                          kind === "query" ? "font-mono" : "arabic-ui"
                        }`}
                        dir={kind === "query" ? "ltr" : undefined}
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
                    {item.detail && <p className="mt-1 text-xs text-muted">{item.detail}</p>}
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
        ))
      )}
    </div>
  );
}
