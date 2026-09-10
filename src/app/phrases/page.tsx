import { readIndex } from "@/lib/data/serverData";
import { PhrasesPageContent } from "@/components/phrases/PhrasesPageContent";

export const metadata = { title: "Phrase search" };

export default function PhrasesPage() {
  const index = readIndex();
  const roots = index.roots.map((r) => ({ ar: r.ar, key: r.key, count: r.count }));

  return <PhrasesPageContent roots={roots} />;
}
