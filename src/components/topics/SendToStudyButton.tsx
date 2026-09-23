"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { addQuerySet, createStudy, getStudies } from "@/lib/notebook/store";
import { useT } from "@/lib/i18n/LanguageContext";
import type { Study } from "@/lib/notebook/types";

/**
 * Turns a topic (or a Names entry -- the same TopicDefinition shape) into a
 * Study query set: the topic's curated roots/lemmas, as one QCQL query, so
 * a researcher can combine it with other sets by intersect/union/subtract
 * instead of re-typing the query by hand. See lib/topics/topicSourceToQcql.
 */
export function SendToStudyButton({ label, qcql }: { label: string; qcql: string }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [studies, setStudies] = useState<Study[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // One-time hydration from localStorage on open, not a subscription; see
    // SaveButton's identical comment.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setStudies(getStudies());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function addTo(studyId: string) {
    addQuerySet(studyId, label, qcql);
    setOpen(false);
    router.push(`/studies/?id=${studyId}`);
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (trimmed === "") return;
    const study = createStudy(trimmed);
    setNewTitle("");
    addTo(study.id);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <FlaskConical size={13} />
        {t.sendToStudy.button}
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-64 rounded-lg border border-border bg-surface p-3 text-start shadow-lg">
          <p className="text-xs text-muted">{t.sendToStudy.hint}</p>

          {studies.length > 0 && (
            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {studies.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addTo(s.id)}
                  className="block w-full truncate rounded-md px-2 py-1.5 text-start text-xs text-ink hover:bg-accent/10 hover:text-accent"
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleCreate} className="mt-2 flex gap-1.5 border-t border-border pt-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t.sendToStudy.newStudyPlaceholder}
              dir="auto"
              className="min-w-0 flex-1 rounded-md border border-border bg-bg px-2 py-1 text-xs text-ink outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={newTitle.trim() === ""}
              className="shrink-0 rounded-md border border-accent bg-accent/10 px-2 py-1 text-xs text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
            >
              {t.sendToStudy.newStudyButton}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
