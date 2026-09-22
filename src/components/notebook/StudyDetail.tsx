"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Download, Loader2, Plus, Trash2 } from "lucide-react";
import {
  getIndex,
  getMorphologyIndex,
  getOccurrenceIndex,
  getSurah,
  getSyntaxIndex,
} from "@/lib/data/loader";
import {
  addDerivedSet,
  addQuerySet,
  deleteStudy,
  exportStudyJson,
  getStudy,
  removeSet,
  renameStudy,
  updateSetLabel,
  updateSetNote,
  updateStudyNotes,
} from "@/lib/notebook/store";
import {
  evaluateStudy,
  matchesOf,
  studyNeedsMorphology,
  type EvaluatedSet,
} from "@/lib/notebook/evaluate";
import { buildStudySetsTable } from "@/lib/notebook/exportTable";
import { describeSetSource, SET_OP_SYMBOL, type SetOp, type Study } from "@/lib/notebook/types";
import { getSavedItems } from "@/lib/notes/store";
import type { SavedItem } from "@/lib/notes/types";
import { KwicRow } from "@/components/ayah/KwicRow";
import { ExportButton } from "@/components/export/ExportButton";
import { buildMatchesTable } from "@/lib/export/matches";
import type { QcqlCorpus } from "@/lib/qcql/execute";
import { parseQcql } from "@/lib/qcql/parse";
import { QcqlError } from "@/lib/qcql/types";
import { useT } from "@/lib/i18n/LanguageContext";
import type { SurahFile, SurahMeta } from "@/lib/data/types";

const PREVIEW_CAP = 20;

/** A saved query's id is "query:<the QCQL source>" -- see lib/notes/types.ts. */
function qcqlFromSavedId(id: string): string | null {
  const prefix = "query:";
  return id.startsWith(prefix) ? id.slice(prefix.length) : null;
}

/**
 * One study: its notes, its sets (each a QCQL query or a set-algebra
 * combination of two other sets), and the tools to add, combine, preview
 * and export them.
 *
 * Every set is evaluated against the corpus whenever the set of sets
 * changes -- editing a label or a note does not re-run anything, only
 * adding, combining or removing a set does (see `setsSignature` below).
 */
export function StudyDetail({
  studyId,
  surahs,
  onClose,
}: {
  studyId: string;
  surahs: SurahMeta[];
  onClose: () => void;
}) {
  const t = useT();
  const [study, setStudy] = useState<Study | null | undefined>(undefined);
  const [corpus, setCorpus] = useState<QcqlCorpus | null>(null);
  const [evaluated, setEvaluated] = useState<Map<string, EvaluatedSet>>(new Map());
  const [evaluating, setEvaluating] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedItem[]>([]);

  const [newLabel, setNewLabel] = useState("");
  const [newQuery, setNewQuery] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [op, setOp] = useState<SetOp>("intersect");
  const [combineLabel, setCombineLabel] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [verses, setVerses] = useState<Map<number, SurahFile>>(new Map());

  const surahByNum = useMemo(() => new Map(surahs.map((s) => [s.n, s])), [surahs]);

  const reload = useCallback(() => {
    setStudy(getStudy(studyId) ?? null);
  }, [studyId]);

  useEffect(() => {
    // One-time hydration from localStorage on mount; see SavedList's identical comment.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    setSavedQueries(getSavedItems().filter((i) => i.kind === "query"));
  }, [reload]);

  // A stable string that changes only when a set is added, combined or
  // removed -- not when a label or note is edited -- so those edits never
  // re-run every query in the study.
  const setsSignature = useMemo(
    () => JSON.stringify((study?.sets ?? []).map((s) => ({ id: s.id, source: s.source }))),
    [study],
  );

  const load = useCallback(
    async (wantMorphology: boolean): Promise<QcqlCorpus> => {
      if (corpus && (!wantMorphology || corpus.morphology)) return corpus;
      const [occurrences, syntax, index, morphology] = await Promise.all([
        corpus?.occurrences ?? getOccurrenceIndex(),
        corpus?.syntax ?? getSyntaxIndex(),
        corpus?.index ?? getIndex(),
        wantMorphology ? getMorphologyIndex() : Promise.resolve(corpus?.morphology),
      ]);
      const next: QcqlCorpus = { occurrences, syntax, index, surahs, morphology };
      setCorpus(next);
      return next;
    },
    [corpus, surahs],
  );

  useEffect(() => {
    if (!study || study.sets.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEvaluated(new Map());
      return;
    }
    let cancelled = false;
    setEvaluating(true);
    void load(studyNeedsMorphology(study)).then((c) => {
      if (cancelled) return;
      setEvaluated(evaluateStudy(study, c));
      setEvaluating(false);
    });
    return () => {
      cancelled = true;
    };
    // Deliberately keyed on setsSignature, not `study` or `load` -- see the
    // comment above setsSignature.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setsSignature]);

  useEffect(() => {
    if (!expandedId) return;
    const result = evaluated.get(expandedId);
    if (!result) return;
    const needed = [...new Set(matchesOf(result).slice(0, PREVIEW_CAP).map((m) => m.s))].filter(
      (n) => !verses.has(n),
    );
    if (needed.length === 0) return;
    let cancelled = false;
    void Promise.all(needed.map((n) => getSurah(n))).then((files) => {
      if (cancelled) return;
      setVerses((prev) => {
        const next = new Map(prev);
        for (const f of files) next.set(f.n, f);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [expandedId, evaluated, verses]);

  if (study === undefined) return null;

  if (study === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">{t.studiesPage.notFound}</p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent"
        >
          <ArrowLeft size={14} /> {t.studiesPage.backToList}
        </button>
      </div>
    );
  }

  function handleAddQuery(e: FormEvent) {
    e.preventDefault();
    const q = newQuery.trim();
    if (q === "" || !study) return;
    try {
      parseQcql(q);
    } catch (err) {
      setAddError(err instanceof QcqlError ? err.message : t.queryPage.unexpectedError);
      return;
    }
    addQuerySet(study.id, newLabel.trim() || q, q);
    setNewLabel("");
    setNewQuery("");
    setAddError(null);
    reload();
  }

  function handleImportSavedQuery(qcql: string, label: string) {
    if (!study) return;
    addQuerySet(study.id, label, qcql);
    reload();
  }

  function handleCombine(e: FormEvent) {
    e.preventDefault();
    if (!study || !leftId || !rightId || leftId === rightId) return;
    const leftLabel = study.sets.find((s) => s.id === leftId)?.label ?? "?";
    const rightLabel = study.sets.find((s) => s.id === rightId)?.label ?? "?";
    const label = combineLabel.trim() || `${leftLabel} ${SET_OP_SYMBOL[op]} ${rightLabel}`;
    addDerivedSet(study.id, label, op, leftId, rightId);
    setLeftId("");
    setRightId("");
    setCombineLabel("");
    reload();
  }

  function handleRemoveSet(id: string) {
    if (!study) return;
    removeSet(study.id, id);
    if (expandedId === id) setExpandedId(null);
    reload();
  }

  function handleDeleteStudy() {
    if (!study) return;
    deleteStudy(study.id);
    onClose();
  }

  function handleDownloadBackup() {
    if (!study) return;
    const blob = new Blob([exportStudyJson(study)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${study.title.replace(/[^\w.-]+/g, "-") || "study"}.qstudy.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent"
        >
          <ArrowLeft size={14} /> {t.studiesPage.backToList}
        </button>
        <button
          type="button"
          onClick={handleDeleteStudy}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Trash2 size={13} /> {t.studiesPage.deleteStudy}
        </button>
      </div>

      <div>
        <input
          value={study.title}
          onChange={(e) => {
            renameStudy(study.id, e.target.value);
            reload();
          }}
          aria-label={t.studiesPage.titlePlaceholder}
          className="w-full bg-transparent text-2xl font-semibold text-ink outline-none focus:underline"
        />
        <textarea
          value={study.notes}
          onChange={(e) => {
            updateStudyNotes(study.id, e.target.value);
            reload();
          }}
          placeholder={t.studiesPage.notesPlaceholder}
          rows={3}
          className="mt-2 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          {t.studiesPage.setsHeading}
        </h2>
        {study.sets.length === 0 ? (
          <p className="text-sm text-muted">{t.studiesPage.noSets}</p>
        ) : (
          study.sets.map((set) => {
            const result = evaluated.get(set.id);
            const isExpanded = expandedId === set.id;
            const definition = describeSetSource(set, study.sets);
            return (
              <div key={set.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <input
                      value={set.label}
                      onChange={(e) => {
                        updateSetLabel(study.id, set.id, e.target.value);
                        reload();
                      }}
                      className="w-full min-w-0 bg-transparent text-sm font-medium text-ink outline-none focus:underline"
                    />
                    <p dir="ltr" className="mt-0.5 truncate font-mono text-xs text-muted">
                      {definition}
                    </p>
                    <p className="mt-1 text-xs">
                      {evaluating && !result ? (
                        <Loader2 size={11} className="inline animate-spin text-muted" />
                      ) : result?.error ? (
                        <span className="text-red-500">{result.error}</span>
                      ) : (
                        <span className="text-muted">
                          {t.studiesPage.resultCount(result?.keys.size ?? 0, result?.verseCount ?? 0)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : set.id)}
                      disabled={!result || result.keys.size === 0}
                      className="text-xs text-muted transition-colors hover:text-accent disabled:opacity-40"
                    >
                      {isExpanded ? t.studiesPage.hide : t.studiesPage.preview}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(set.id)}
                      aria-label={t.studiesPage.removeSetAria(set.label)}
                      className="text-muted hover:text-ink"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <textarea
                  value={set.note}
                  onChange={(e) => {
                    updateSetNote(study.id, set.id, e.target.value);
                    reload();
                  }}
                  placeholder={t.savedList.notePlaceholder}
                  rows={1}
                  className="mt-2 w-full resize-y rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
                {isExpanded && result && !result.error && (
                  <div className="mt-3 border-t border-border pt-2">
                    {matchesOf(result)
                      .slice(0, PREVIEW_CAP)
                      .map((m) => {
                        const surahMeta = surahByNum.get(m.s);
                        const verse = verses.get(m.s)?.verses.find((v) => v.a === m.a);
                        if (!surahMeta || !verse) return null;
                        return (
                          <KwicRow
                            key={`${m.s}:${m.a}:${m.w}`}
                            surahMeta={surahMeta}
                            ayah={m.a}
                            tokens={verse.w}
                            wordIndex={m.w}
                          />
                        );
                      })}
                    {result.keys.size > PREVIEW_CAP && (
                      <p className="mt-2 text-xs text-muted">
                        {t.studiesPage.previewCapped(PREVIEW_CAP, result.keys.size)}
                      </p>
                    )}
                    <div className="mt-2">
                      <ExportButton
                        path={`/studies/?id=${study.id}`}
                        subject={{ kind: "study", label: `${study.title}: ${set.label}` }}
                        resolve={() =>
                          buildMatchesTable(matchesOf(result), surahs, {
                            slug: `${study.title}-${set.label}`,
                            title: `${study.title}: ${set.label}`,
                            provenance: [
                              { label: "definition", value: definition },
                              { label: "matches", value: String(result.keys.size) },
                            ],
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleAddQuery} className="space-y-2 rounded-xl border border-border bg-surface p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
          {t.studiesPage.addSetHeading}
        </h3>
        <div className="flex flex-wrap gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={t.studiesPage.setLabelPlaceholder}
            className="w-40 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <input
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            dir="ltr"
            spellCheck={false}
            autoComplete="off"
            placeholder={t.queryPage.placeholder}
            className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={newQuery.trim() === ""}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent bg-accent/10 px-3 py-2 text-sm text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
          >
            <Plus size={14} /> {t.studiesPage.addSet}
          </button>
        </div>
        {addError && <p className="text-xs text-red-500">{addError}</p>}

        {savedQueries.length > 0 && (
          <div className="pt-1">
            <p className="text-xs text-muted">{t.studiesPage.orFromSaved}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {savedQueries.map((item) => {
                const qcql = qcqlFromSavedId(item.id);
                if (!qcql) return null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleImportSavedQuery(qcql, item.label)}
                    dir="ltr"
                    className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </form>

      {study.sets.length >= 2 && (
        <form
          onSubmit={handleCombine}
          className="space-y-2 rounded-xl border border-border bg-surface p-4"
        >
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
            {t.studiesPage.combineHeading}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2 py-2 text-sm text-ink"
            >
              <option value="">{t.studiesPage.pickSet}</option>
              {study.sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={op}
              onChange={(e) => setOp(e.target.value as SetOp)}
              className="rounded-lg border border-border bg-bg px-2 py-2 text-sm text-ink"
            >
              <option value="intersect">
                {SET_OP_SYMBOL.intersect} {t.studiesPage.opIntersect}
              </option>
              <option value="union">
                {SET_OP_SYMBOL.union} {t.studiesPage.opUnion}
              </option>
              <option value="subtract">
                {SET_OP_SYMBOL.subtract} {t.studiesPage.opSubtract}
              </option>
            </select>
            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2 py-2 text-sm text-ink"
            >
              <option value="">{t.studiesPage.pickSet}</option>
              {study.sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <input
              value={combineLabel}
              onChange={(e) => setCombineLabel(e.target.value)}
              placeholder={t.studiesPage.setLabelPlaceholder}
              className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={!leftId || !rightId || leftId === rightId}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent bg-accent/10 px-3 py-2 text-sm text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
            >
              {t.studiesPage.combine}
            </button>
          </div>
          {op === "subtract" && <p className="text-xs text-muted">{t.studiesPage.subtractOrderHint}</p>}
        </form>
      )}

      {study.sets.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            {t.studiesPage.exportHeading}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton
              path={`/studies/?id=${study.id}`}
              subject={{ kind: "study", label: study.title }}
              resolve={() => buildStudySetsTable(study, evaluated)}
            />
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Download size={13} /> {t.studiesPage.downloadBackup}
            </button>
          </div>
          <p className="text-xs text-muted/70">{t.studiesPage.exportHint}</p>
        </div>
      )}
    </div>
  );
}
