"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FlaskConical, Trash2, Upload } from "lucide-react";
import { createStudy, deleteStudy, getStudies, importStudyJson } from "@/lib/notebook/store";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LanguageContext";
import type { Study } from "@/lib/notebook/types";

/**
 * Every study in this browser, plus how to start or bring in one more.
 *
 * A study is a named collection of QCQL sets combined by set algebra (see
 * lib/notebook) -- the unit up from a single saved query. Persisted
 * entirely in localStorage, like everything else under /saved/.
 */
export function StudyList({ onOpen }: { onOpen: (id: string) => void }) {
  const t = useT();
  const [studies, setStudies] = useState<Study[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // One-time hydration from localStorage; see SavedList's identical comment.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStudies(getStudies());
    setLoaded(true);
  }, []);

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed === "") return;
    const study = createStudy(trimmed);
    setTitle("");
    onOpen(study.id);
  }

  function handleDelete(id: string) {
    deleteStudy(id);
    setStudies(getStudies());
  }

  async function handleImport(file: File) {
    try {
      const study = importStudyJson(await file.text());
      setStudies(getStudies());
      setMessage(t.studiesPage.importSummary(study.title, study.sets.length));
    } catch {
      setMessage(t.studiesPage.importFailed);
    }
  }

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.studiesPage.titlePlaceholder}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={title.trim() === ""}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent bg-accent/10 px-4 py-2 text-sm text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
        >
          {t.studiesPage.create}
        </button>
      </form>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          {t.studiesPage.listHeading}
        </h2>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <Upload size={13} /> {t.studiesPage.import}
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
      </div>

      {message && <p className="text-xs text-muted">{message}</p>}

      {studies.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title={t.studiesPage.emptyTitle}
          description={t.studiesPage.empty}
        />
      ) : (
        <div className="space-y-3">
          {studies.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onOpen(s.id)}
                  className="flex min-w-0 items-center gap-2 text-start text-sm font-medium text-accent hover:text-accent-strong"
                >
                  <FlaskConical size={14} className="shrink-0" />
                  <span className="truncate">{s.title}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  aria-label={t.studiesPage.removeAria(s.title)}
                  className="shrink-0 text-muted hover:text-ink"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted">{t.studiesPage.setCount(s.sets.length)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
