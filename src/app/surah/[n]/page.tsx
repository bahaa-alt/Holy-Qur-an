import { Suspense } from "react";
import { notFound } from "next/navigation";
import { readMeta, readSurahFile } from "@/lib/data/serverData";
import { SurahVerseList } from "@/components/surah/SurahVerseList";
import { SurahPageChrome } from "@/components/surah/SurahPageChrome";
import { LoadingVersesFallback } from "@/components/surah/LoadingVersesFallback";

export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({ n: String(i + 1) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const meta = readMeta();
  const surahMeta = meta.surahs.find((s) => s.n === Number(n));
  return { title: surahMeta ? `${surahMeta.translit} — Surah ${n}` : "Surah" };
}

export default async function SurahPage({ params }: { params: Promise<{ n: string }> }) {
  const { n: nStr } = await params;
  const n = Number(nStr);
  const meta = readMeta();
  const surahMeta = meta.surahs.find((s) => s.n === n);
  if (!surahMeta) notFound();

  const surahFile = readSurahFile(n);

  return (
    <SurahPageChrome n={n} surahMeta={surahMeta}>
      <Suspense fallback={<LoadingVersesFallback />}>
        <SurahVerseList surahMeta={surahMeta} verses={surahFile.verses} />
      </Suspense>
    </SurahPageChrome>
  );
}
