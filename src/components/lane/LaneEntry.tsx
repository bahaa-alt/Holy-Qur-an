import { Fragment } from "react";

/**
 * Renders one lexicon article from its sigil-prefixed token stream (see
 * LaneRootFile) through ordinary React elements.
 *
 * Never innerHTML. The source is TEI markup from a 253 MB third-party
 * database; passing it through as HTML would inject arbitrary markup into
 * the page. Tokenising at build time also lets the Arabic spans carry their
 * own dir/lang instead of inheriting the paragraph's direction, which is the
 * difference between a legible entry and a scrambled one.
 */
export function LaneEntry({ tokens }: { tokens: string[] }) {
  return (
    <p className="text-sm leading-relaxed text-ink">
      {tokens.map((tok, i) => {
        const kind = tok[0];
        const value = tok.slice(1);
        switch (kind) {
          case "a":
            return (
              <bdi key={i} dir="rtl" lang="ar" className="arabic-ui">
                {value}
              </bdi>
            );
          case "e":
            return <em key={i}>{value}</em>;
          case "s":
            return (
              <strong key={i} className="me-1 ms-1 text-accent">
                {value}.
              </strong>
            );
          case "p":
            return (
              <span
                key={i}
                className="mx-1 align-super text-[10px] text-muted/60"
                title={`Printed page ${value}`}
              >
                [{value}]
              </span>
            );
          case "^":
            // Lane's mark for a tropical (figurative) usage.
            return (
              <span key={i} className="text-accent/70" title="Tropical (figurative) usage">
                ↓
              </span>
            );
          default:
            return <Fragment key={i}>{value}</Fragment>;
        }
      })}
    </p>
  );
}
