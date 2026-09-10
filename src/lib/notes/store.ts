import type { SavedItem } from "./types";

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
