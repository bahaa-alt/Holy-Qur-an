import { readIndex } from "@/lib/data/serverData";
import { HomeContent } from "@/components/home/HomeContent";

export default function Home() {
  const index = readIndex();
  const topRoots = [...index.roots].sort((a, b) => b.count - a.count).slice(0, 30);
  const allRootNames = index.roots.map((r) => r.ar);

  return <HomeContent topRoots={topRoots} allRootNames={allRootNames} totalRootCount={index.roots.length} />;
}
