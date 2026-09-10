import { Suspense } from "react";
import { notFound } from "next/navigation";
import { readAbjad, readDistinctiveVocab, readMeta, readRhyme, readSurahFile } from "@/lib/data/serverData";
import { surahRhymeSummary } from "@/lib/quran/rhyme";
import { SurahVerseList } from "@/components/surah/SurahVerseList";
import { SurahPageChrome } from "@/components/surah/SurahPageChrome";
import { SurahInsightsPanel } from "@/components/surah/SurahInsightsPanel";
import { LoadingVersesFallback } from "@/components/surah/LoadingVersesFallback";
import { ReadingModeProvider } from "@/lib/surah/ReadingModeContext";

const DISTINCTIVE_ROOTS_SHOWN = 5;

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

  const distinctiveRoots = readDistinctiveVocab().bySurah[n - 1]?.slice(0, DISTINCTIVE_ROOTS_SHOWN) ?? [];
  const rhyme = surahRhymeSummary(readRhyme().rows, n);
  const abjadTotal = readAbjad().bySurah[n - 1] ?? 0;

  return (
    <ReadingModeProvider>
      <SurahPageChrome n={n} surahMeta={surahMeta}>
        <SurahInsightsPanel
          distinctiveRoots={distinctiveRoots}
          rhymeDominant={rhyme.dominant}
          rhymeTotalVerses={rhyme.totalVerses}
          abjadTotal={abjadTotal}
        />
        <div className="mt-6">
          <Suspense fallback={<LoadingVersesFallback />}>
            <SurahVerseList surahMeta={surahMeta} verses={surahFile.verses} />
          </Suspense>
        </div>
      </SurahPageChrome>
    </ReadingModeProvider>
  );
}
