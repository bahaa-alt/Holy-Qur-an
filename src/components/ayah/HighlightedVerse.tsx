"use client";

import { useState } from "react";
import { buildHighlightedVerse } from "@/lib/highlight";
import { WordInfoPanel } from "./WordInfoPanel";

export function HighlightedVerse({
  s,
  a,
  tokens,
  highlightIndices,
  emphasisIndex,
}: {
  /** surah and ayah this verse belongs to, needed to look up a clicked word's root/lemma */
  s: number;
  a: number;
  tokens: string[];
  highlightIndices: number[];
  emphasisIndex?: number;
}) {
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const parts = buildHighlightedVerse(tokens, highlightIndices, emphasisIndex);

  return (
    <div>
      <p className="uthmani text-ink">
        {parts.map((part, i) => {
          const w = i + 1;
          return (
            <span key={i}>
              <button
                type="button"
                onClick={() => setSelectedWord((prev) => (prev === w ? null : w))}
                className={`rounded transition-colors hover:bg-accent/10 ${
                  selectedWord === w ? "bg-accent/15" : ""
                } ${part.level === "emphasis" ? "word-emphasis" : part.level === "highlight" ? "word-highlight" : ""}`}
              >
                {part.text}
              </button>
              {i < parts.length - 1 ? " " : ""}
            </span>
          );
        })}
      </p>
      {selectedWord !== null && (
        <WordInfoPanel
          key={`${s}:${a}:${selectedWord}`}
          s={s}
          a={a}
          w={selectedWord}
          token={tokens[selectedWord - 1]}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}
