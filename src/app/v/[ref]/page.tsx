import { notFound } from "next/navigation";
import { readManifest, readMeta, readSurahFile } from "@/lib/data/serverData";
import { VersePageContent } from "@/components/verse/VersePageContent";

/**
 * The citable atom: one page per verse, at /v/2:255/.
 *
 * Until now a verse had no page of its own -- 2:255 was a query parameter on
 * a 286-verse document (/surah/2/?ayah=255), so there was nothing to cite and
 * nowhere to hang an apparatus. Everything this app has learned about a verse
 * was scattered across features that could only link at a scroll position.
 *
 * DELIBERATELY THIN. 6,236 more pages at the measured cost of a word page
 * (65 KiB on disk once 4 KiB block quantization is counted) would add 390 MiB
 * to a 624 MiB export and leave ~10 MiB under GitHub Pages' 1 GB hard limit,
 * which is not a margin. So only what identifies and cites the verse is
 * rendered statically -- reference, text, translations, metrics. Every
 * apparatus layer (morphology, syntax, readings, tafsir, lexicon, parallels)
 * already loads lazily on click, so the rich page costs nothing until asked
 * for. Lean, this lands at ~819 MiB.
 */
export function generateStaticParams() {
  const meta = readMeta();
  return meta.surahs.flatMap((s) =>
    Array.from({ length: s.ayahs }, (_, i) => ({ ref: `${s.n}:${i + 1}` })),
  );
}

function parseRef(ref: string): { s: number; a: number } | null {
  const m = /^(\d+):(\d+)$/.exec(decodeURIComponent(ref));
  if (!m) return null;
  return { s: Number(m[1]), a: Number(m[2]) };
}

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const parsed = parseRef(ref);
  if (!parsed) return { title: "Verse" };
  const meta = readMeta();
  const surah = meta.surahs.find((s) => s.n === parsed.s);
  return {
    title: surah ? `${parsed.s}:${parsed.a} — ${surah.translit}` : `${parsed.s}:${parsed.a}`,
  };
}

export default async function VersePage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const parsed = parseRef(ref);
  if (!parsed) notFound();

  const meta = readMeta();
  const surahMeta = meta.surahs.find((s) => s.n === parsed.s);
  if (!surahMeta || parsed.a < 1 || parsed.a > surahMeta.ayahs) notFound();

  const verse = readSurahFile(parsed.s).verses.find((v) => v.a === parsed.a);
  if (!verse) notFound();

  return (
    <VersePageContent
      s={parsed.s}
      a={parsed.a}
      surahMeta={surahMeta}
      verse={verse}
      reading={readManifest().reading}
    />
  );
}
