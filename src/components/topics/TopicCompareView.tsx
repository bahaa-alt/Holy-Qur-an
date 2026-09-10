"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getLemma, getRoot } from "@/lib/data/loader";
import { ALL_TOPICS, findTopicBySlug, type TopicDefinition } from "@/lib/topics/topicDefinitions";
import { buildTopicVerseMatches, topicSourceFileKey, type TopicVerseMatch } from "@/lib/topics/buildTopicOccurrences";
import { decodeTopicsQuery, encodeTopicsQuery } from "@/lib/topics/query";
import { TopicPicker } from "./TopicPicker";
import { TopicVerseList } from "./TopicVerseList";
import { useT } from "@/lib/i18n/LanguageContext";
import type { RootFile } from "@/lib/data/types";

/**
 * Client-side sibling of `/topics/[slug]/`'s server-side matching: reuses
 * the same pure `buildTopicVerseMatches`/`topicSourceFileKey` functions,
 * just fetching each source's RootFile at runtime via getRoot/getLemma
 * (already used this way by CompareView) instead of readRootFile/
 * readLemmaFile at build time. Files are cached in one shared map keyed by
 * topicSourceFileKey so two selected topics that happen to share a root
 * (unlikely today, but not assumed against) fetch it once.
 */
export function TopicCompareView() {
  const t = useT();
  // Starts empty to match the prerendered static HTML -- see CompareView's
  // identical comment for why the real initial selection is read from the
  // URL only after mount, never via useState's lazy initializer.
  const [selected, setSelected] = useState<string[]>([]);
  const [files, setFiles] = useState<Map<string, RootFile>>(new Map());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initial = decodeTopicsQuery(new URLSearchParams(window.location.search).get("topics")).filter((slug) =>
      ALL_TOPICS.some((topic) => topic.slug === slug),
    );
    if (initial.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from the URL, not a subscription; see CompareView.
      setSelected(initial);
    }
    setHydrated(true);
  }, []);

  // Keeps the URL in sync with the current selection, skipped until after
  // hydration so it never clobbers a `?topics=` query with the empty
  // pre-hydration selection -- same pattern as CompareView.
  useEffect(() => {
    if (!hydrated) return;
    const query = encodeTopicsQuery(selected);
    const next = query ? `${window.location.pathname}?topics=${query}` : window.location.pathname;
    window.history.replaceState(null, "", next);
  }, [selected, hydrated]);

  const selectedTopics = useMemo(
    () => selected.map((slug) => findTopicBySlug(slug)).filter((topic): topic is TopicDefinition => !!topic),
    [selected],
  );

  useEffect(() => {
    const toFetch = new Map<string, () => Promise<RootFile>>();
    for (const topic of selectedTopics) {
      for (const source of topic.sources) {
        const key = topicSourceFileKey(source);
        if (files.has(key) || toFetch.has(key)) continue;
        toFetch.set(key, () => (source.kind === "rootlessLemma" ? getLemma(source.lemmaKey) : getRoot(source.root)));
      }
    }
    if (toFetch.size === 0) return;
    let cancelled = false;
    Promise.all([...toFetch.entries()].map(async ([key, fetchFile]) => [key, await fetchFile()] as const)).then(
      (entries) => {
        if (cancelled) return;
        setFiles((prev) => {
          const next = new Map(prev);
          for (const [key, file] of entries) next.set(key, file);
          return next;
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [selectedTopics, files]);

  const topicMatches = useMemo(() => {
    const map = new Map<string, TopicVerseMatch[]>();
    for (const topic of selectedTopics) {
      const ready = topic.sources.every((source) => files.has(topicSourceFileKey(source)));
      if (ready) map.set(topic.slug, buildTopicVerseMatches(topic.sources, files));
    }
    return map;
  }, [selectedTopics, files]);

  const stillLoading = selectedTopics.length > 0 && selectedTopics.some((topic) => !topicMatches.has(topic.slug));

  return (
    <div className="space-y-6">
      <TopicPicker selected={selected} onChange={setSelected} />

      {stillLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" /> {t.topicCompareView.loadingTopics}
        </div>
      )}

      {!stillLoading && selectedTopics.length >= 2 && (
        <div className="grid gap-6 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {selectedTopics.map((topic) => {
            const matches = topicMatches.get(topic.slug) ?? [];
            return (
              <div key={topic.slug} className="min-w-0 space-y-3">
                <div>
                  <h2 className="arabic-ui text-lg font-semibold text-ink">{topic.labelAr}</h2>
                  <p className="text-xs text-muted">
                    {topic.labelEn} · {t.topicCompareView.verseCount(matches.length)}
                  </p>
                </div>
                <TopicVerseList matches={matches} />
              </div>
            );
          })}
        </div>
      )}

      {!stillLoading && selectedTopics.length === 1 && (
        <p className="text-center text-sm text-muted">{t.topicCompareView.pickAtLeastOneMore}</p>
      )}
    </div>
  );
}
