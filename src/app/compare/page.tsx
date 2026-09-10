import { readIndex } from "@/lib/data/serverData";
import { ComparePageContent } from "@/components/compare/ComparePageContent";

export const metadata = { title: "Compare roots" };

export default function ComparePage() {
  const index = readIndex();
  const roots = index.roots.map((r) => ({ ar: r.ar, key: r.key, count: r.count, glossShort: r.glossShort }));

  return <ComparePageContent roots={roots} />;
}
