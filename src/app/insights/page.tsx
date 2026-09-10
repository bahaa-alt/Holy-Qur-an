import { readIndex, readInsights, readMeta } from "@/lib/data/serverData";
import { rootHref, wordHref } from "@/lib/search/suggest";
import { InsightsPageContent } from "@/components/insights/InsightsPageContent";

export const metadata = { title: "Insights" };

export default function InsightsPage() {
  const insights = readInsights();
  const index = readIndex();
  const meta = readMeta();

  // Resolve /root/ and /word/ links here (server-side, once) rather than
  // shipping index.json to the client just to look up ~30 hrefs.
  const rootsBySurahCoverage = insights.rootsBySurahCoverage.map((row) => ({
    ...row,
    href: rootHref(row.ar),
  }));
  const lemmasBySurahCoverage = insights.lemmasBySurahCoverage.map((row) => {
    const rootIdx = row.rootAr ? index.roots.findIndex((r) => r.ar === row.rootAr) : -1;
    const globalIdx = index.lemmas.findIndex((l) => l.key === row.key && l.rootIdx === rootIdx);
    return { ...row, href: globalIdx >= 0 ? wordHref(globalIdx) : null };
  });

  return (
    <InsightsPageContent
      insights={insights}
      meta={meta}
      rootsBySurahCoverage={rootsBySurahCoverage}
      lemmasBySurahCoverage={lemmasBySurahCoverage}
      mostDerivedRootHref={rootHref(insights.mostDerivedRoot.ar)}
      mostFormsRootHref={rootHref(insights.mostFormsRoot.ar)}
    />
  );
}
