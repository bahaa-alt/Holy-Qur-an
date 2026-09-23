"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Quote } from "lucide-react";
import { getManifest } from "@/lib/data/loader";
import {
  buildBibTeX,
  buildCitation,
  buildCslJson,
  buildRIS,
  citationKey,
  type CitationSubject,
} from "@/lib/citation/buildCitation";
import { copyToClipboard } from "@/lib/clipboard";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ManifestFile } from "@/lib/data/types";

type Format = "text" | "bibtex" | "ris" | "csl";

/**
 * The one citation control every citable page uses: a plain-text citation
 * to the clipboard (the common case, one click) plus three machine-readable
 * exports a reference manager reads directly (BibTeX, RIS, CSL-JSON).
 *
 * The manifest (dataset version/hash) is fetched lazily on first open, not
 * passed in -- so a reader who never cites anything never pays for it,
 * matching ExportButton's existing "resolve on click" convention.
 */
export function CiteMenu({ subject, path }: { subject: CitationSubject; path: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function resolve(): Promise<{ manifest: ManifestFile; url: string }> {
    const [{ absoluteUrl }, manifest] = await Promise.all([import("@/lib/site"), getManifest()]);
    return { manifest, url: absoluteUrl(path) };
  }

  async function handle(format: Format) {
    const { manifest, url } = await resolve();
    if (format === "text") {
      if (await copyToClipboard(buildCitation(subject, manifest, url))) {
        setCopied(true);
        setOpen(false);
        setTimeout(() => setCopied(false), 1500);
      }
      return;
    }

    const builders: Record<Exclude<Format, "text">, { build: () => string; ext: string; mime: string }> = {
      bibtex: { build: () => buildBibTeX(subject, manifest, url), ext: "bib", mime: "application/x-bibtex" },
      ris: { build: () => buildRIS(subject, manifest, url), ext: "ris", mime: "application/x-research-info-systems" },
      csl: { build: () => buildCslJson(subject, manifest, url), ext: "json", mime: "application/vnd.citationstyles.csl+json" },
    };
    const { build, ext, mime } = builders[format];
    const blob = new Blob([build()], { type: mime });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${citationKey(subject, new Date(manifest.builtAt).getUTCFullYear())}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => (copied ? undefined : setOpen((v) => !v))}
        aria-expanded={open}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
      >
        {copied ? <Check size={13} className="text-accent" /> : <Quote size={13} />}
        {copied ? t.citeButton.copied : t.citeButton.cite}
        {!copied && <ChevronDown size={11} />}
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-48 rounded-lg border border-border bg-surface p-1 text-start shadow-lg">
          <button
            type="button"
            onClick={() => void handle("text")}
            className="block w-full rounded-md px-2.5 py-1.5 text-start text-xs text-ink hover:bg-accent/10 hover:text-accent"
          >
            {t.citeButton.copyText}
          </button>
          <button
            type="button"
            onClick={() => void handle("bibtex")}
            className="block w-full rounded-md px-2.5 py-1.5 text-start text-xs text-ink hover:bg-accent/10 hover:text-accent"
          >
            {t.citeButton.bibtex}
          </button>
          <button
            type="button"
            onClick={() => void handle("ris")}
            className="block w-full rounded-md px-2.5 py-1.5 text-start text-xs text-ink hover:bg-accent/10 hover:text-accent"
          >
            {t.citeButton.ris}
          </button>
          <button
            type="button"
            onClick={() => void handle("csl")}
            className="block w-full rounded-md px-2.5 py-1.5 text-start text-xs text-ink hover:bg-accent/10 hover:text-accent"
          >
            {t.citeButton.cslJson}
          </button>
        </div>
      )}
    </div>
  );
}
