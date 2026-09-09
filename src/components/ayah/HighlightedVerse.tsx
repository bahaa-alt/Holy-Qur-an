import { buildHighlightedVerse } from "@/lib/highlight";

export function HighlightedVerse({
  tokens,
  highlightIndices,
  emphasisIndex,
}: {
  tokens: string[];
  highlightIndices: number[];
  emphasisIndex?: number;
}) {
  const parts = buildHighlightedVerse(tokens, highlightIndices, emphasisIndex);

  return (
    <p className="uthmani text-ink">
      {parts.map((part, i) => (
        <span
          key={i}
          className={part.level === "emphasis" ? "word-emphasis" : part.level === "highlight" ? "word-highlight" : ""}
        >
          {part.text}
          {i < parts.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
