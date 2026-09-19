import { readMeta } from "@/lib/data/serverData";
import { QueryPageContent } from "@/components/query/QueryPageContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Query",
  alternates: { canonical: absoluteUrl("/query/") },
};

export default function QueryPage() {
  // Surah metadata is small and every result row needs it, so it is passed
  // from the server rather than fetched; the two query indices are fetched
  // on first run, because arriving at this page should cost nothing.
  return <QueryPageContent surahs={readMeta().surahs} />;
}
