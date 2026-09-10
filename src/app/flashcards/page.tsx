import { readIndex } from "@/lib/data/serverData";
import { FlashcardsPageContent } from "@/components/flashcards/FlashcardsPageContent";

export const metadata = { title: "Flashcards" };

export default function FlashcardsPage() {
  const index = readIndex();
  return <FlashcardsPageContent roots={index.roots} lemmas={index.lemmas} />;
}
