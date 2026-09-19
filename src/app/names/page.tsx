import { NamesPageContent } from "@/components/names/NamesPageContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Names of Allah",
  alternates: { canonical: absoluteUrl("/names/") },
};

export default function NamesPage() {
  return <NamesPageContent />;
}
