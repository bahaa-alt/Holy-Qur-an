import type { ManifestFile } from "@/lib/data/types";

export const APP_NAME = "Qur'anic Root & Word Research";

export interface CitationSubject {
  kind: "root" | "word";
  label: string;
}

/**
 * Builds a plain-text citation string for a root or word page. `url` and
 * `accessedOn` are injected by the caller (rather than read from
 * `window`/`Date.now()` here) so this stays a pure, deterministic function.
 */
export function buildCitation(
  subject: CitationSubject,
  manifest: Pick<ManifestFile, "version" | "builtAt" | "hash">,
  url: string,
  accessedOn: Date = new Date(),
): string {
  const subjectLabel = subject.kind === "root" ? "Root" : "Word";
  const builtDate = new Date(manifest.builtAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const accessedDate = accessedOn.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    `${APP_NAME}. ${subjectLabel} ${subject.label}. ` +
    `Dataset v${manifest.version} (built ${builtDate}, hash ${manifest.hash}). ` +
    `Accessed ${accessedDate}. ${url}`
  );
}
