import { readIndex } from "@/lib/data/serverData";
import { LemmaRootGamePageContent } from "@/components/games/LemmaRootGamePageContent";

export const metadata = { title: "Match word to root — Games" };

export default function LemmaRootGamePage() {
  const index = readIndex();
  return <LemmaRootGamePageContent roots={index.roots} lemmas={index.lemmas} />;
}
