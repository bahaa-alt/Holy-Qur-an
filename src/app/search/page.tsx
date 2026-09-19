import { readIndex } from "@/lib/data/serverData";
import { SearchHubContent } from "@/components/search/SearchHubContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Search, Phrases & Compare",
  alternates: { canonical: absoluteUrl("/search/") },
};

export default function SearchPage() {
  const index = readIndex();
  const phraseRoots = index.roots.map((r) => ({ ar: r.ar, key: r.key, count: r.count }));
  const compareRoots = index.roots.map((r) => ({
    ar: r.ar,
    key: r.key,
    count: r.count,
    glossShort: r.glossShort,
  }));

  return <SearchHubContent phraseRoots={phraseRoots} compareRoots={compareRoots} />;
}
