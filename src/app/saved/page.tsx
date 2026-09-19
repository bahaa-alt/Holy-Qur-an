import { SavedPageContent } from "@/components/notes/SavedPageContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Saved",
  alternates: { canonical: absoluteUrl("/saved/") },
};

export default function SavedPage() {
  return <SavedPageContent />;
}
