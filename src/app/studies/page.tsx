import { readMeta } from "@/lib/data/serverData";
import { StudiesPageContent } from "@/components/notebook/StudiesPageContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Studies",
  alternates: { canonical: absoluteUrl("/studies/") },
};

export default function StudiesPage() {
  return <StudiesPageContent surahs={readMeta().surahs} />;
}
