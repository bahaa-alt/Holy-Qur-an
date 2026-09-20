import type { SavedItem, SavedKind } from "./types";

/**
 * Notes & bookmarks, persisted entirely in localStorage -- no server, no
 * account, matching the rest of this app. Every read/write is wrapped in
 * try/catch (private browsing, blocked storage, a full quota all throw)
 * so a saved-items feature failing silently never breaks the page around it.
 */
const STORAGE_KEY = "qrr:saved";

function readAll(): SavedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: SavedItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable or full -- nothing more we can do here
  }
}

/** All saved items, most recently saved first. */
export function getSavedItems(): SavedItem[] {
  return readAll().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function isSaved(id: string): boolean {
  return readAll().some((i) => i.id === id);
}

export function saveItem(item: Omit<SavedItem, "savedAt">): void {
  const items = readAll().filter((i) => i.id !== item.id);
  items.push({ ...item, savedAt: new Date().toISOString() });
  writeAll(items);
}

export function removeItem(id: string): void {
  writeAll(readAll().filter((i) => i.id !== id));
}

export function updateNote(id: string, note: string): void {
  const items = readAll();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return;
  items[idx] = { ...items[idx], note };
  writeAll(items);
}

/**
 * The saved items as a portable JSON document.
 *
 * localStorage is per-browser and per-device, and a privacy setting or a
 * cleared cache takes it with no warning. A "save" feature without an
 * export is a promise of persistence this app cannot keep, so the
 * notebook can always be carried out and back in.
 */
export function exportSaved(): string {
  return JSON.stringify(
    { format: SAVED_FORMAT, exportedAt: new Date().toISOString(), items: readAll() },
    null,
    2,
  );
}

export const SAVED_FORMAT = "qrr-saved-v1";

/** The most items an import will accept, so a malformed file cannot fill the quota. */
const IMPORT_LIMIT = 5000;

const KINDS: readonly SavedKind[] = ["root", "word", "verse", "query", "view"];

/**
 * Whether an imported record is a saved item this app will store.
 *
 * `href` is checked hard: these become links the reader clicks, and an
 * imported file is untrusted input -- a `javascript:` or cross-origin
 * href would turn a notebook someone shared into an attack. Only
 * app-relative paths are accepted, and `//host` is rejected along with
 * everything else that is not a single leading slash.
 */
function isImportableItem(value: unknown): value is SavedItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  const strings = ["id", "label", "href"].every(
    (k) => typeof item[k] === "string" && item[k] !== "",
  );
  if (!strings) return false;
  if (!KINDS.includes(item.kind as SavedKind)) return false;
  const href = item.href as string;
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  if (item.note !== undefined && typeof item.note !== "string") return false;
  if (item.detail !== undefined && typeof item.detail !== "string") return false;
  return true;
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
}

/**
 * Merges an exported notebook into this browser's.
 *
 * Merge, not replace: someone importing on a second device has saves
 * there already, and losing them would be the worst possible outcome of
 * pressing "import". Where both sides hold the same id, the one saved
 * later wins.
 */
export function importSaved(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("not-json");
  }
  const raw = (parsed as { items?: unknown })?.items;
  if (!Array.isArray(raw)) throw new Error("not-a-notebook");

  const existing = new Map(readAll().map((i) => [i.id, i]));
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const candidate of raw.slice(0, IMPORT_LIMIT)) {
    if (!isImportableItem(candidate)) {
      skipped += 1;
      continue;
    }
    const savedAt =
      typeof (candidate as SavedItem).savedAt === "string"
        ? (candidate as SavedItem).savedAt
        : new Date().toISOString();
    const item: SavedItem = {
      id: candidate.id,
      kind: candidate.kind,
      label: candidate.label,
      href: candidate.href,
      detail: candidate.detail,
      note: typeof candidate.note === "string" ? candidate.note : "",
      savedAt,
    };
    const prev = existing.get(item.id);
    if (!prev) {
      existing.set(item.id, item);
      added += 1;
    } else if (item.savedAt > prev.savedAt) {
      existing.set(item.id, item);
      updated += 1;
    } else {
      skipped += 1;
    }
  }
  skipped += Math.max(0, raw.length - IMPORT_LIMIT);

  writeAll([...existing.values()]);
  return { added, updated, skipped };
}
