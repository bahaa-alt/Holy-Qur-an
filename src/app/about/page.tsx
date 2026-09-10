import { readIndex, readManifest } from "@/lib/data/serverData";
import { AboutContent } from "@/components/about/AboutContent";

export const metadata = { title: "About" };

export default function AboutPage() {
  const manifest = readManifest();
  const rootNames = readIndex().roots.map((r) => r.ar);

  return <AboutContent manifest={manifest} rootNames={rootNames} />;
}
