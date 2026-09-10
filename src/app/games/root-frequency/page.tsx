import { readIndex } from "@/lib/data/serverData";
import { RootFrequencyGamePageContent } from "@/components/games/RootFrequencyGamePageContent";

export const metadata = { title: "Root frequency — Games" };

export default function RootFrequencyGamePage() {
  const index = readIndex();
  return <RootFrequencyGamePageContent roots={index.roots} />;
}
