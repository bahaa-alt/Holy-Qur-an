import { NAME_PHRASES, type NamePhraseDef } from "./namePhrases";

/**
 * The Names page's Phrases list, editable and persisted entirely in
 * localStorage -- no server, no account, matching the rest of this app
 * (see src/lib/notes/store.ts for the identical pattern). The stored
 * value, once it exists, IS the full list (seeded from the curated
 * NAME_PHRASES defaults on first use); add/edit/remove all just mutate
 * that list and write it back whole, same as notes/store.ts.
 *
 * A future change to the curated defaults won't retroactively appear for
 * someone who has already customized their list (their stored snapshot
 * takes over entirely) -- resetToDefaults() is the deliberate escape
 * hatch for that, not something this store tries to reconcile itself.
 */
const STORAGE_KEY = "qrr:namePhrases";

function readAll(): NamePhraseDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return NAME_PHRASES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : NAME_PHRASES;
  } catch {
    return NAME_PHRASES;
  }
}

function writeAll(phrases: NamePhraseDef[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(phrases));
  } catch {
    // storage unavailable or full -- nothing more we can do here
  }
}

function newSlug(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** The current phrase list -- the curated defaults until customized. */
export function getPhrases(): NamePhraseDef[] {
  return readAll();
}

/** Appends a new phrase, generating its slug. Returns the full updated list. */
export function addPhrase(phraseAr: string, labelEn: string): NamePhraseDef[] {
  const phrases = [...readAll(), { slug: newSlug(), phraseAr, labelEn }];
  writeAll(phrases);
  return phrases;
}

/** Edits an existing phrase (by slug, curated or custom). Returns the full updated list. */
export function updatePhrase(slug: string, phraseAr: string, labelEn: string): NamePhraseDef[] {
  const phrases = readAll().map((p) => (p.slug === slug ? { ...p, phraseAr, labelEn } : p));
  writeAll(phrases);
  return phrases;
}

/** Removes a phrase (by slug, curated or custom). Returns the full updated list. */
export function removePhrase(slug: string): NamePhraseDef[] {
  const phrases = readAll().filter((p) => p.slug !== slug);
  writeAll(phrases);
  return phrases;
}

/** Discards all customization, reverting to the curated defaults. */
export function resetToDefaults(): NamePhraseDef[] {
  writeAll(NAME_PHRASES);
  return NAME_PHRASES;
}
