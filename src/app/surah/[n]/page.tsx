import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { readMeta, readSurahFile } from "@/lib/data/serverData";
import { SurahVerseList } from "@/components/surah/SurahVerseList";

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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between text-sm">
        {n > 1 ? (
          <Link href={`/surah/${n - 1}/`} className="inline-flex items-center gap-1 text-accent hover:text-accent-strong">
            <ArrowLeft size={14} /> Previous
          </Link>
        ) : (
          <span />
        )}
        {n < 114 ? (
          <Link href={`/surah/${n + 1}/`} className="inline-flex items-center gap-1 text-accent hover:text-accent-strong">
            Next <ArrowRight size={14} />
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Surah {n} · {surahMeta.type === "meccan" ? "Meccan" : "Medinan"} · {surahMeta.ayahs} verses
        </p>
        <h1 className="arabic-ui mt-1 text-3xl font-semibold text-ink">{surahMeta.nameAr}</h1>
        <p className="text-sm text-muted">
          {surahMeta.translit} — {surahMeta.nameEn}
        </p>
      </div>

      <div className="mt-8">
        <Suspense fallback={<p className="text-center text-sm text-muted">Loading verses…</p>}>
          <SurahVerseList surahMeta={surahMeta} verses={surahFile.verses} />
        </Suspense>
      </div>
    </div>
  );
}
