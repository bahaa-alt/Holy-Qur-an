"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import type { Suggestion } from "@/lib/search/suggest";
import { SuggestionItem } from "./SuggestionItem";

export function SuggestionList({
  suggestions,
  activeIndex,
  onSelect,
}: {
  suggestions: Suggestion[];
  activeIndex: number;
  onSelect: (s: Suggestion) => void;
}) {
  const t = useT();

  if (suggestions.length === 0) return null;

  return (
    <ul role="listbox" aria-label={t.suggestionList.ariaLabel} className="max-h-96 overflow-y-auto py-1">
      {suggestions.map((s, i) => (
        <SuggestionItem key={s.key} suggestion={s} active={i === activeIndex} onSelect={() => onSelect(s)} />
      ))}
    </ul>
  );
}
