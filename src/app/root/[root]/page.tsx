import { notFound } from "next/navigation";
import { readIndex, readManifest, readRootFile } from "@/lib/data/serverData";
import { buildRootSummary } from "@/lib/root/summary";
import { RootHeader } from "@/components/root/RootHeader";
import { CiteButton } from "@/components/root/CiteButton";
import { FrequencyChart } from "@/components/root/FrequencyChart";
import { FormsTable } from "@/components/root/FormsTable";
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

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <RootHeader
        summary={summary}
        actions={<CiteButton subject={{ kind: "root", label: root }} manifest={manifest} />}
      />
      <FrequencyChart byCategory={summary.byCategory} byLemma={summary.byLemma} />
      <FormsTable forms={file.forms} lemmas={file.lemmas} />
      <AyahExplorer key={root} source={{ kind: "root", root }} filenameBase={`root-${root}`} />
    </div>
  );
}
