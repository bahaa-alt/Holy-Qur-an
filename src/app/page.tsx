import { readIndex } from "@/lib/data/serverData";
import { HomeContent } from "@/components/home/HomeContent";
import { absoluteUrl } from "@/lib/site";

// Stated rather than inherited from the layout. It is the same URL today,
// but a page whose canonical depends on a default elsewhere is one layout
// edit away from being wrong, and every other route declares its own.
export const metadata = { alternates: { canonical: absoluteUrl("/") } };

export default function Home() {
  const index = readIndex();
  const topRoots = [...index.roots].sort((a, b) => b.count - a.count).slice(0, 30);
  const allRootNames = index.roots.map((r) => r.ar);

  return (
    <HomeContent
      topRoots={topRoots}
      allRootNames={allRootNames}
      totalRootCount={index.roots.length}
    />
  );
}
