import { readIndex } from "@/lib/data/serverData";
import { ComparePageContent } from "@/components/compare/ComparePageContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Compare roots",
  alternates: { canonical: absoluteUrl("/compare/") },
};

export default function ComparePage() {
  const index = readIndex();
  const roots = index.roots.map((r) => ({
    ar: r.ar,
    key: r.key,
    count: r.count,
    glossShort: r.glossShort,
  }));

  return <ComparePageContent roots={roots} />;
}
