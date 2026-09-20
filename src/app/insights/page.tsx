import { readInsights, readMeta } from "@/lib/data/serverData";
import { rootHref } from "@/lib/search/suggest";
import { InsightsPageContent } from "@/components/insights/InsightsPageContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Insights",
  alternates: { canonical: absoluteUrl("/insights/") },
};

export default function InsightsPage() {
  const insights = readInsights();

  return (
    <InsightsPageContent
      insights={insights}
      meta={readMeta()}
      mostDerivedRootHref={rootHref(insights.mostDerivedRoot.ar)}
      mostFormsRootHref={rootHref(insights.mostFormsRoot.ar)}
    />
  );
}
