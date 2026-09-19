import { readIndex } from "@/lib/data/serverData";
import { RootsPageContent } from "@/components/root/RootsPageContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Browse all roots",
  alternates: { canonical: absoluteUrl("/roots/") },
};

export default function RootsPage() {
  const index = readIndex();
  const roots = index.roots.map((r) => ({ ar: r.ar, key: r.key, count: r.count }));

  return <RootsPageContent roots={roots} />;
}
