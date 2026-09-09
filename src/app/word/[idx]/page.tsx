import { notFound } from "next/navigation";
import { readIndex, readLemmaFile, readManifest, readRootFile } from "@/lib/data/serverData";
import { WordHeader } from "@/components/word/WordHeader";
import { CiteButton } from "@/components/root/CiteButton";
import { FormsTable } from "@/components/root/FormsTable";
import { AyahExplorer } from "@/components/ayah/AyahExplorer";
import type { RootFormEntry, RootLemmaEntry } from "@/lib/data/types";

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

  if (row.rootIdx !== -1) {
    root = index.roots[row.rootIdx].ar;
    const rootFile = readRootFile(root);
    const localLemmaIdx = rootFile.lemmas.findIndex((l) => l.lemma === row.lemma);
    forms = rootFile.forms.filter((f) => f.lemmaIdx === localLemmaIdx);
    lemmas = rootFile.lemmas;
  } else {
    const lemmaFile = readLemmaFile(row.key);
    forms = lemmaFile.forms;
    lemmas = lemmaFile.lemmas;
  }

  const manifest = readManifest();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <WordHeader
        lemma={row.lemma}
        root={root}
        cat={row.cat}
        count={row.count}
        formCount={forms.length}
        actions={<CiteButton subject={{ kind: "word", label: row.lemma }} manifest={manifest} />}
      />
      <FormsTable forms={forms} lemmas={lemmas} />
      <AyahExplorer
        key={idx}
        source={root ? { kind: "root", root } : { kind: "lemma", key: row.key }}
        filenameBase={`word-${row.key}`}
        initialFilters={root ? { lemmaKey: row.key } : {}}
      />
    </div>
  );
}
