"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import type { Suggestion } from "@/lib/search/suggest";

export function SuggestionItem({
  suggestion,
  active,
  onSelect,
}: {
  suggestion: Suggestion;
  active: boolean;
  onSelect: () => void;
}) {
  const t = useT();
  const isArabicPrimary = suggestion.kind !== "verse" && suggestion.kind !== "search";

  return (
    <li>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSelect}
        className={`flex w-full items-start gap-3 px-3 py-2 text-left transition-colors ${
          active ? "bg-accent/10" : "hover:bg-surface"
        }`}
      >
        <span className="mt-0.5 shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
          {t.suggestionKind[suggestion.kind]}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate font-medium text-ink ${isArabicPrimary ? "arabic-ui text-lg" : ""}`}
          >
            {suggestion.primary}
          </span>
          {suggestion.secondary && (
            <span className="block truncate text-xs text-muted">{suggestion.secondary}</span>
          )}
        </span>
        {typeof suggestion.count === "number" && (
          <span className="mt-0.5 shrink-0 text-xs text-muted">{suggestion.count.toLocaleString()}×</span>
        )}
      </button>
    </li>
  );
}
