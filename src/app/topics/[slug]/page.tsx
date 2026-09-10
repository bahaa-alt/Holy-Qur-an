import { notFound } from "next/navigation";
import { readLemmaFile, readRootFile } from "@/lib/data/serverData";
import { ALL_TOPICS, findTopicBySlug } from "@/lib/topics/topicDefinitions";
import { buildTopicVerseMatches, topicSourceFileKey } from "@/lib/topics/buildTopicOccurrences";
import { TopicPageContent } from "@/components/topics/TopicPageContent";
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

  return <TopicPageContent topic={topic} matches={matches} />;
}
