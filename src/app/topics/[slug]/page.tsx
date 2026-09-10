import { notFound } from "next/navigation";
import { readLemmaFile, readRootFile } from "@/lib/data/serverData";
import { ALL_TOPICS, findTopicBySlug } from "@/lib/topics/topicDefinitions";
import { buildTopicVerseMatches, topicSourceFileKey } from "@/lib/topics/buildTopicOccurrences";
import { TopicVerseList } from "@/components/topics/TopicVerseList";
import type { RootFile } from "@/lib/data/types";

export function generateStaticParams() {
  return ALL_TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = findTopicBySlug(slug);
  return { title: topic ? `${topic.labelEn} — Topics` : "Topic" };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = findTopicBySlug(slug);
  if (!topic) notFound();

  // Resolve every distinct source file this topic needs (a theme can span
  // several roots) once, at build time -- the same readRootFile/readLemmaFile
  // functions root/word pages already use, just called for more than one
  // file here.
  const files = new Map<string, RootFile>();
  for (const source of topic.sources) {
    const key = topicSourceFileKey(source);
    if (files.has(key)) continue;
    files.set(key, source.kind === "rootlessLemma" ? readLemmaFile(source.lemmaKey) : readRootFile(source.root));
  }

  const matches = buildTopicVerseMatches(topic.sources, files);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {topic.category === "prophet" ? "Prophet" : "Topic"}
        </p>
        <h1 className="arabic-ui mt-1 text-3xl font-semibold text-ink">{topic.labelAr}</h1>
        <p className="text-sm text-muted">{topic.labelEn}</p>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          A curated root/lemma index, not derived from tafsir (classical commentary) -- a starting point for
          finding candidate verses, not a claim about what a verse means. {matches.length.toLocaleString()} verse
          {matches.length === 1 ? "" : "s"} matched.
        </p>
        {topic.note && <p className="mt-2 max-w-2xl text-xs text-muted/80">Note: {topic.note}</p>}
      </div>
      <TopicVerseList matches={matches} />
    </div>
  );
}
