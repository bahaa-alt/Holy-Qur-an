"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { getMeta, getVerseRoots, getVerses } from "@/lib/data/loader";
import { globalIdToRef } from "@/lib/data/verseId";
import { findAdjacentRootPairs } from "@/lib/phrases/findAdjacentPairs";
import { AyahCard } from "@/components/ayah/AyahCard";
import { CopyTextButton } from "@/components/export/CopyTextButton";
import { RootSlotPicker, type RootSlotOption } from "./RootSlotPicker";
import type { MetaFile, VerseRootsFile } from "@/lib/data/types";

function buildMarkdown(results: readonly { s: number; a: number; translation: string }[]): string {
  return results.map((r) => `- [${r.s}:${r.a}](/surah/${r.s}/?ayah=${r.a}) -- ${r.translation}`).join("\n");
}

const RESULT_CAP = 50;

interface ResultRow {
  s: number;
  a: number;
  tokens: string[];
  translation: string;
  pickthall?: string;
  leadW: number;
  followW: number;
}

export function PhraseSearch({ roots }: { roots: RootSlotOption[] }) {
  const [leadRoot, setLeadRoot] = useState<string | null>(null);
  const [followRoot, setFollowRoot] = useState<string | null>(null);
  const [verseRoots, setVerseRoots] = useState<VerseRootsFile | null>(null);
  const [meta, setMeta] = useState<MetaFile | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);
  const [results, setResults] = useState<ResultRow[]>([]);

  useEffect(() => {
    Promise.all([getVerseRoots(), getMeta()]).then(([vr, m]) => {
      setVerseRoots(vr);
      setMeta(m);
    });
  }, []);

  const rootIndexByAr = useMemo(() => new Map(roots.map((r, i) => [r.ar, i])), [roots]);
  const ready = verseRoots !== null && meta !== null && leadRoot !== null && followRoot !== null;

  async function handleSearch() {
    if (!ready || !verseRoots || !meta || !leadRoot || !followRoot) return;
    const leadIdx = rootIndexByAr.get(leadRoot);
    const followIdx = rootIndexByAr.get(followRoot);
    if (leadIdx === undefined || followIdx === undefined) return;

    setLoading(true);
    setSearched(true);
    try {
      const matches = findAdjacentRootPairs(verseRoots, leadIdx, followIdx);
      setTotalMatches(matches.length);
      const capped = matches.slice(0, RESULT_CAP);

      const refs = capped
        .map((m) => globalIdToRef(meta, m.globalId))
        .filter((r): r is { s: number; a: number } => r !== null);
      const verseMap = await getVerses(refs);

      const rows = capped
        .map((m): ResultRow | null => {
          const ref = globalIdToRef(meta, m.globalId);
          if (!ref) return null;
          const verse = verseMap.get(`${ref.s}:${ref.a}`);
          if (!verse) return null;
          return {
            s: ref.s,
            a: ref.a,
            tokens: verse.w,
            translation: verse.t,
            pickthall: verse.pickthall,
            leadW: m.leadW,
            followW: m.followW,
          };
        })
        .filter((r): r is ResultRow => r !== null);
      setResults(rows);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end">
          <RootSlotPicker label="Leading root" roots={roots} selected={leadRoot} onChange={setLeadRoot} />
          <RootSlotPicker label="Followed by" roots={roots} selected={followRoot} onChange={setFollowRoot} />
          <button
            type="button"
            disabled={!ready || loading}
            onClick={handleSearch}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </div>
      </div>

      {searched && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {totalMatches === 0
              ? "No verses found where the leading root is immediately followed by the second root."
              : `${totalMatches.toLocaleString()} match${totalMatches === 1 ? "" : "es"}${
                  totalMatches > RESULT_CAP ? ` (showing the first ${RESULT_CAP})` : ""
                }.`}
          </p>
          {results.length > 0 && <CopyTextButton text={buildMarkdown(results)} />}
        </div>
      )}

      <div className="space-y-3">
        {results.map((row) => {
          const surahMeta = meta?.surahs.find((s) => s.n === row.s);
          if (!surahMeta) return null;
          return (
            <AyahCard
              key={`${row.s}-${row.a}-${row.leadW}`}
              surahMeta={surahMeta}
              ayah={row.a}
              tokens={row.tokens}
              translation={row.translation}
              pickthall={row.pickthall}
              highlightIndices={[row.leadW, row.followW]}
              emphasisIndex={row.leadW}
            />
          );
        })}
      </div>
    </div>
  );
}
