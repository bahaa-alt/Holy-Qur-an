import { notFound } from "next/navigation";
import { readFormulas, readMeta, readSurahFile } from "@/lib/data/serverData";
import { FormulaDetailView, type FormulaOccurrence } from "@/components/insights/FormulaDetailView";

export function generateStaticParams() {
  const formulas = readFormulas();
  return formulas.lengths.flatMap((group) =>
    group.rows.map((row) => ({ length: String(group.length), key: row.phraseKey })),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ length: string; key: string }> }) {
  const { key: rawKey } = await params;
  return { title: `Formula: ${decodeURIComponent(rawKey)}` };
}

export default async function FormulaDetailPage({
  params,
}: {
  params: Promise<{ length: string; key: string }>;
}) {
  const { length: lengthStr, key: rawKey } = await params;
  const length = Number(lengthStr);
  const phraseKey = decodeURIComponent(rawKey);

  const formulas = readFormulas();
  const group = formulas.lengths.find((g) => g.length === length);
  const row = group?.rows.find((r) => r.phraseKey === phraseKey);
  if (!row) notFound();

  const meta = readMeta();
  const surahMetaByNum = new Map(meta.surahs.map((s) => [s.n, s]));
  const surahFileByNum = new Map(
    [...new Set(row.refs.map((ref) => ref.s))].map((n) => [n, readSurahFile(n)]),
  );

  const occurrences: FormulaOccurrence[] = row.refs.flatMap((ref) => {
    const surahMeta = surahMetaByNum.get(ref.s);
    const verse = surahFileByNum.get(ref.s)?.verses.find((v) => v.a === ref.a);
    if (!surahMeta || !verse) return [];
    return [
      {
        surahMeta,
        ayah: ref.a,
        tokens: verse.w,
        translation: verse.t,
        pickthall: verse.pickthall,
        highlightIndices: Array.from({ length }, (_, i) => ref.w + i),
      },
    ];
  });

  return <FormulaDetailView length={length} row={row} occurrences={occurrences} />;
}
