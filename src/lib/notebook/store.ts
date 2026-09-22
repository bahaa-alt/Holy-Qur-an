import type { SetOp, Study, StudySet } from "./types";
import { STUDY_FORMAT } from "./types";
import { sanitizeStudySets } from "./sanitize";

/**
 * Studies, persisted entirely in localStorage -- no server, no account,
 * matching the rest of this app (see lib/notes/store.ts, which this
 * mirrors). Every read/write is wrapped in try/catch so a broken
 * localStorage never breaks the page around it.
 */
const STORAGE_KEY = "qrr:studies";

function genId(prefix: string): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}:${crypto.randomUUID()}`;
    }
  } catch {
    // fall through to the fallback below
  }
  return `${prefix}:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readAll(): Study[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(studies: Study[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(studies));
  } catch {
    // storage unavailable or full -- nothing more we can do here
  }
}

/** Most recently updated first, so the study someone is working on is on top. */
export function getStudies(): Study[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getStudy(id: string): Study | undefined {
  return readAll().find((s) => s.id === id);
}

function persist(study: Study): Study {
  const next = { ...study, updatedAt: new Date().toISOString() };
  const all = readAll().filter((s) => s.id !== next.id);
  all.push(next);
  writeAll(all);
  return next;
}

export function createStudy(title: string): Study {
  const now = new Date().toISOString();
  const study: Study = {
    id: genId("study"),
    title,
    notes: "",
    sets: [],
    createdAt: now,
    updatedAt: now,
  };
  writeAll([...readAll(), study]);
  return study;
}

export function deleteStudy(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function renameStudy(id: string, title: string): Study | undefined {
  const study = getStudy(id);
  return study ? persist({ ...study, title }) : undefined;
}

export function updateStudyNotes(id: string, notes: string): Study | undefined {
  const study = getStudy(id);
  return study ? persist({ ...study, notes }) : undefined;
}

export function addQuerySet(
  studyId: string,
  label: string,
  qcql: string,
  note = "",
): StudySet | undefined {
  const study = getStudy(studyId);
  if (!study) return undefined;
  const set: StudySet = { id: genId("set"), label, note, source: { kind: "query", qcql } };
  persist({ ...study, sets: [...study.sets, set] });
  return set;
}

export function addDerivedSet(
  studyId: string,
  label: string,
  op: SetOp,
  leftId: string,
  rightId: string,
  note = "",
): StudySet | undefined {
  const study = getStudy(studyId);
  if (!study) return undefined;
  const ids = new Set(study.sets.map((s) => s.id));
  if (!ids.has(leftId) || !ids.has(rightId)) return undefined;
  const set: StudySet = { id: genId("set"), label, note, source: { kind: "op", op, left: leftId, right: rightId } };
  persist({ ...study, sets: [...study.sets, set] });
  return set;
}

export function updateSetNote(studyId: string, setId: string, note: string): void {
  const study = getStudy(studyId);
  if (!study) return;
  persist({ ...study, sets: study.sets.map((s) => (s.id === setId ? { ...s, note } : s)) });
}

export function updateSetLabel(studyId: string, setId: string, label: string): void {
  const study = getStudy(studyId);
  if (!study) return;
  persist({ ...study, sets: study.sets.map((s) => (s.id === setId ? { ...s, label } : s)) });
}

/** Every set that depends on `id`, directly or transitively (fixpoint over the flat list). */
function dependents(sets: readonly StudySet[], id: string): Set<string> {
  const deps = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const s of sets) {
      if (deps.has(s.id) || s.source.kind !== "op") continue;
      const { left, right } = s.source;
      if (left === id || right === id || deps.has(left) || deps.has(right)) {
        deps.add(s.id);
        grew = true;
      }
    }
  }
  return deps;
}

/**
 * Removes a set and, transitively, every derived set built from it --
 * leaving a dangling derived set behind would silently change what it
 * means rather than announce that its input is gone.
 */
export function removeSet(studyId: string, setId: string): void {
  const study = getStudy(studyId);
  if (!study) return;
  const toRemove = new Set([setId, ...dependents(study.sets, setId)]);
  persist({ ...study, sets: study.sets.filter((s) => !toRemove.has(s.id)) });
}

export function exportStudyJson(study: Study): string {
  return JSON.stringify({ format: STUDY_FORMAT, exportedAt: new Date().toISOString(), study }, null, 2);
}

/**
 * Imports a study as a NEW entry, always with a fresh id.
 *
 * Never overwrites an existing study by id: two browsers editing "the same"
 * study concurrently have no way to merge a set graph (unlike the flat
 * saved-items list in lib/notes, where last-write-wins per item is a
 * reasonable default), so importing is append-only and the reader decides
 * what to do with the duplicate.
 */
export function importStudyJson(json: string): Study {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("not-json");
  }
  const raw = (parsed as { study?: unknown })?.study;
  if (typeof raw !== "object" || raw === null) throw new Error("not-a-study");
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== "string") throw new Error("not-a-study");

  const now = new Date().toISOString();
  const study: Study = {
    id: genId("study"),
    title: r.title,
    notes: typeof r.notes === "string" ? r.notes : "",
    sets: sanitizeStudySets(r.sets),
    createdAt: typeof r.createdAt === "string" ? r.createdAt : now,
    updatedAt: now,
  };
  writeAll([...readAll(), study]);
  return study;
}
