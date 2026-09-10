import { readIndex } from "@/lib/data/serverData";
import { RootMeaningGamePageContent } from "@/components/games/RootMeaningGamePageContent";

export const metadata = { title: "Guess the meaning — Games" };

export default function RootMeaningGamePage() {
  const index = readIndex();
  return <RootMeaningGamePageContent roots={index.roots} />;
}
