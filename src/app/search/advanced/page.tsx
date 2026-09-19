import { AdvancedSearchView } from "@/components/search/AdvancedSearchView";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Advanced search",
  alternates: { canonical: absoluteUrl("/search/advanced/") },
};

export default function AdvancedSearchPage() {
  return <AdvancedSearchView />;
}
