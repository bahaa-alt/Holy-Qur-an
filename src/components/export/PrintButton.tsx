"use client";

import { Printer } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";

/**
 * Print / "Save as PDF" -- deliberately a thin window.print() trigger, not
 * a PDF-generation library. This app already loads its Arabic Uthmani font
 * via next/font and has proven RTL/light-dark handling in the browser;
 * generating a PDF with a library (e.g. @react-pdf/renderer, jspdf) would
 * mean re-embedding that font and re-solving RTL shaping in a second
 * rendering pipeline, adding real bytes and a second place for bugs to
 * hide, for an app that is explicitly offline-first and dependency-averse.
 * The tradeoff: print-layout fidelity (page breaks, etc.) varies slightly
 * by browser/OS "Save as PDF" driver -- acceptable here, and each page's
 * `@media print` rules (globals.css) plus Tailwind's print: variant handle
 * hiding chrome and forcing light-mode colors either way.
 */
export function PrintButton({ onBeforePrint }: { onBeforePrint?: () => void | Promise<void> }) {
  const t = useT();

  async function handleClick() {
    if (typeof window === "undefined") return;
    if (onBeforePrint) await onBeforePrint();
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="print:hidden inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <Printer size={13} />
      {t.printButton.label}
    </button>
  );
}
