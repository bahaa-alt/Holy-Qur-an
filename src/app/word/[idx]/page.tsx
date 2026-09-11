import { notFound } from "next/navigation";
import { readIndex, readLemmaFile, readManifest, readRootFile, readSurahFile } from "@/lib/data/serverData";
import { buildOccurrenceRows, filterRows } from "@/lib/root/occurrences";
import { buildWordPositionStats } from "@/lib/word/positionStats";
import { WordHeader } from "@/components/word/WordHeader";
import { CiteButton } from "@/components/root/CiteButton";
import { SaveButton } from "@/components/notes/SaveButton";
import { FormsTable } from "@/components/root/FormsTable";
import { WordPositionStatsCard } from "@/components/word/WordPositionStatsCard";
import { AyahExplorer } from "@/components/ayah/AyahExplorer";
import type { RootFile, RootFormEntry, RootLemmaEntry } from "@/lib/data/types";

export function generateStaticParams() {
  const index = readIndex();
  return index.lemmas.map((_, i) => ({ idx: String(i) }));
}

export async function generateMetadata({ params }: { params: Promise<{ idx: string }> }) {
  const { idx } = await params;
  const index = readIndex();
  const row = index.lemmas[Number(idx)];
  return { title: row ? row.lemma : "Word" };
}

export default async function WordPage({ params }: { params: Promise<{ idx: string }> }) {
  const { idx: idxStr } = await params;
  const idx = Number(idxStr);
  const index = readIndex();
  const row = index.lemmas[idx];
  if (!row) notFound();

  let forms: RootFormEntry[];
  let lemmas: RootLemmaEntry[];
  let root: string | null = null;
  let file: RootFile;

  if (row.rootIdx !== -1) {
    root = index.roots[row.rootIdx].ar;
    const rootFile = readRootFile(root);
    const localLemmaIdx = rootFile.lemmas.findIndex((l) => l.lemma === row.lemma);
    forms = rootFile.forms.filter((f) => f.lemmaIdx === localLemmaIdx);
    lemmas = rootFile.lemmas;
    file = rootFile;
  } else {
    const lemmaFile = readLemmaFile(row.key);
    forms = lemmaFile.forms;
    lemmas = lemmaFile.lemmas;
    file = lemmaFile;
  }

  const manifest = readManifest();

  // A rootless lemma file's occ is already scoped to this exact word; a
  // rooted one covers the whole root, so it's filtered to this lemma's
  // key, same as AyahExplorer's own initialFilters below.
  const occRows = root ? filterRows(buildOccurrenceRows(file), { lemmaKey: row.key }) : buildOccurrenceRows(file);
  const touchedSurahs = [...new Set(occRows.map((r) => r.s))];
  const verseWordCounts = new Map<string, number>();
  for (const surahNum of touchedSurahs) {
    const surahFile = readSurahFile(surahNum);
    for (const verse of surahFile.verses) {
      verseWordCounts.set(`${surahNum}:${verse.a}`, verse.w.length);
    }
  }
  const positionStats = buildWordPositionStats(occRows, (s, a) => verseWordCounts.get(`${s}:${a}`));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <WordHeader
        lemma={row.lemma}
        root={root}
        cat={row.cat}
        count={row.count}
        formCount={forms.length}
        actions={
          <>
            <SaveButton id={`word:${row.key}`} kind="word" label={row.lemma} href={`/word/${idx}/`} />
            <CiteButton subject={{ kind: "word", label: row.lemma }} manifest={manifest} />
          </>
        }
      />
      <FormsTable forms={forms} lemmas={lemmas} />
      <WordPositionStatsCard stats={positionStats} />
      <AyahExplorer
        key={idx}
        source={root ? { kind: "root", root } : { kind: "lemma", key: row.key }}
        filenameBase={`word-${row.key}`}
        initialFilters={root ? { lemmaKey: row.key } : {}}
      />
    </div>
  );
}
