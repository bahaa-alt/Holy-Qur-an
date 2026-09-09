import { notFound } from "next/navigation";
import { readIndex, readManifest, readMeta, readRootFile } from "@/lib/data/serverData";
import { buildRootSummary } from "@/lib/root/summary";
import { buildSurahDistribution } from "@/lib/root/distribution";
import { RootHeader } from "@/components/root/RootHeader";
import { CiteButton } from "@/components/root/CiteButton";
import { FrequencyChart } from "@/components/root/FrequencyChart";
import { FormsTable } from "@/components/root/FormsTable";
import { SurahDistribution } from "@/components/root/SurahDistribution";
import { AyahExplorer } from "@/components/ayah/AyahExplorer";

export function generateStaticParams() {
  const index = readIndex();
  return index.roots.map((r) => ({ root: r.ar }));
}

export async function generateMetadata({ params }: { params: Promise<{ root: string }> }) {
  const { root: rawRoot } = await params;
  const root = decodeURIComponent(rawRoot);
  return { title: `Root ${root}` };
}

export default async function RootPage({ params }: { params: Promise<{ root: string }> }) {
  const { root: rawRoot } = await params;
  const root = decodeURIComponent(rawRoot);

  let file;
  try {
    file = readRootFile(root);
  } catch {
    notFound();
  }

  const summary = buildRootSummary(file);
  const manifest = readManifest();
  const meta = readMeta();
  const distribution = buildSurahDistribution(file, meta);
  const surahLabels = new Map(meta.surahs.map((s) => [s.n, s.translit]));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <RootHeader
        summary={summary}
        distribution={distribution}
        actions={<CiteButton subject={{ kind: "root", label: root }} manifest={manifest} />}
      />
      <FrequencyChart byCategory={summary.byCategory} byLemma={summary.byLemma} />
      <FormsTable forms={file.forms} lemmas={file.lemmas} />
      {distribution.bySurah.length > 1 && (
        <SurahDistribution
          rows={distribution.bySurah.map((r) => ({
            surah: r.surah,
            label: surahLabels.get(r.surah) ?? String(r.surah),
            count: r.count,
          }))}
        />
      )}
      <AyahExplorer key={root} source={{ kind: "root", root }} filenameBase={`root-${root}`} />
    </div>
  );
}
