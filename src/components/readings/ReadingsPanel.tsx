"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { getReadingSurah, getReadingsMeta } from "@/lib/data/loader";
import { useT } from "@/lib/i18n/LanguageContext";
import type { RiwayaMeta } from "@/lib/data/types";

interface Row {
  riwaya: RiwayaMeta;
  text: string;
}

/**
 * Shows one verse as it reads in each of the seven non-Hafs transmissions
 * this project ships.
 *
 * Deliberately constrained, following the scholarly framing recorded in
 * RESEARCH-PLATFORM.md §5.2:
 *
 *  - SYMMETRIC. Every transmission is listed the same way, Hafs included
 *    and labelled as the app's base text. No strikethroughs, no "variants
 *    from" a baseline -- these are transmitted modes of recitation, not
 *    deviations from a correct original.
 *  - NO COMPUTED CONTENT. Nothing here is diffed, highlighted or scored.
 *    A byte diff between these texts is swamped by orthographic convention
 *    before it finds a single reading difference, and presenting a computed
 *    guess as an apparatus would be exactly the overclaim this app avoids.
 *  - SCOPE STATED. What is shown is written text, so it carries farsh
 *    (wording) differences only. Usul -- madd, imala, idgham, sakt, hamza
 *    treatment -- is most of what audibly distinguishes the readings and
 *    none of it is visible here. The panel says so.
 *
 * Loaded on demand, one surah per riwaya, so a reader who never opens the
 * panel never fetches any of it.
 */
export function ReadingsPanel({ s, a, hafsText }: { s: number; a: number; hafsText: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || rows !== null) return;

    try {
      const meta = await getReadingsMeta();
      const files = await Promise.all(meta.riwayat.map((r) => getReadingSurah(r.slug, s)));
      setRows(
        meta.riwayat.map((riwaya, i) => ({
          riwaya,
          text: files[i].verses.find((v) => v.a === a)?.t ?? "",
        })),
      );
    } catch {
      setFailed(true);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
      >
        <ChevronDown
          size={13}
          className={open ? "rotate-180 transition-transform" : "transition-transform"}
        />
        {t.readings.toggle}
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-lg border border-border/70 p-3">
          {failed ? (
            <p className="text-xs text-muted">{t.readings.failed}</p>
          ) : rows === null ? (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Loader2 size={12} className="animate-spin" />
              {t.readings.loading}
            </p>
          ) : (
            <>
              {/* Hafs first because it is this app's base text and every
                  count in the app is computed from it -- labelled as such,
                  not privileged as "the" reading. */}
              <div>
                <p className="text-xs text-muted">
                  {t.readings.hafsLabel}{" "}
                  <span className="text-muted/70">{t.readings.baseTextNote}</span>
                </p>
                <p className="uthmani mt-1" dir="rtl" lang="ar">
                  {hafsText}
                </p>
              </div>
              {rows.map(({ riwaya, text }) => (
                <div key={riwaya.slug}>
                  <p className="text-xs text-muted">
                    {riwaya.riwaya}{" "}
                    <span className="text-muted/70">{t.readings.viaQari(riwaya.qari)}</span>{" "}
                    <bdi dir="rtl" lang="ar" className="arabic-ui">
                      {riwaya.riwayaAr} عن {riwaya.qariAr}
                    </bdi>
                  </p>
                  <p className="uthmani mt-1" dir="rtl" lang="ar">
                    {text}
                  </p>
                </div>
              ))}
              <p className="border-t border-border/70 pt-2 text-xs leading-relaxed text-muted/80">
                {t.readings.scopeNote}
              </p>
              <p className="text-xs leading-relaxed text-muted/80">{t.readings.numberingNote}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
