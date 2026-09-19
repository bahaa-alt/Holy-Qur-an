import { readMeta, readSyntaxIndex } from "@/lib/data/serverData";
import { describeTag } from "@/lib/morphology/tagLabels";
import { SyntaxPageContent } from "@/components/syntax/SyntaxPageContent";

export const metadata = { title: "Syntax & rhetoric" };

export default function SyntaxPage() {
  const syntax = readSyntaxIndex();
  const meta = readMeta();

  // Counted here (once, at build time) rather than in the client, so the
  // tag picker renders with real numbers on first paint and without the
  // ~215 KB index. The client fetches the index only once a tag is picked.
  const counts = new Array<number>(syntax.tags.length).fill(0);
  for (const t of syntax.t) counts[t] += 1;

  const tags = syntax.tags
    .map((tag, idx) => {
      const label = describeTag(tag);
      return { tag, idx, count: counts[idx], en: label.en, ar: label.ar };
    })
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  return <SyntaxPageContent tags={tags} surahs={meta.surahs} total={syntax.t.length} />;
}
