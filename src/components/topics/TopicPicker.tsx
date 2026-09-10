"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { normalize } from "@/lib/arabic/normalize";
import { useT } from "@/lib/i18n/LanguageContext";
import { ALL_TOPICS, type TopicDefinition } from "@/lib/topics/topicDefinitions";

const MAX_SELECTED = 3;

function matchesQuery(topic: TopicDefinition, normalizedQuery: string, rawQuery: string): boolean {
  return (
    normalize(topic.labelAr).includes(normalizedQuery) ||
    topic.labelEn.toLowerCase().includes(rawQuery) ||
    topic.slug.includes(rawQuery)
  );
}

export function TopicPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (slugs: string[]) => void;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const atLimit = selected.length >= MAX_SELECTED;

  const selectedTopics = useMemo(
    () => selected.map((slug) => ALL_TOPICS.find((topic) => topic.slug === slug)).filter((t): t is TopicDefinition => !!t),
    [selected],
  );

  const matches = useMemo(() => {
    const raw = query.trim().toLowerCase();
    if (raw === "") return [];
    const normalized = normalize(query.trim());
    return ALL_TOPICS.filter((topic) => !selected.includes(topic.slug) && matchesQuery(topic, normalized, raw)).slice(
      0,
      8,
    );
  }, [query, selected]);

  function add(slug: string) {
    if (atLimit || selected.includes(slug)) return;
    onChange([...selected, slug]);
    setQuery("");
  }

  function remove(slug: string) {
    onChange(selected.filter((s) => s !== slug));
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-ink">{t.topicPicker.heading}</h2>
      <p className="mt-1 text-xs text-muted">{t.topicPicker.subtitle(MAX_SELECTED)}</p>

      {selectedTopics.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedTopics.map((topic) => (
            <span
              key={topic.slug}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-ink"
            >
              <span className="arabic-ui">{topic.labelAr}</span>
              <span className="text-xs text-muted">{topic.labelEn}</span>
              <button
                type="button"
                onClick={() => remove(topic.slug)}
                aria-label={t.topicPicker.removeAria(topic.labelEn)}
                className="text-muted hover:text-ink"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      {!atLimit && (
        <div className="mt-4">
          <div className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.topicPicker.searchPlaceholder}
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            />
          </div>
          {matches.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {matches.map((topic) => (
                <button
                  key={topic.slug}
                  type="button"
                  onClick={() => add(topic.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  <span className="arabic-ui">{topic.labelAr}</span>
                  <span className="text-xs text-muted">{topic.labelEn}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
