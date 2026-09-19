import { Fragment } from "react";

/**
 * Renders one Arabic lexicon article from its sigil-prefixed token stream
 * (see MujamRootFile) through ordinary React elements.
 *
 * Never innerHTML, for the same reason LaneEntry avoids it: the source is
 * text from a third-party database, and passing it through as HTML would
 * inject arbitrary markup into the page.
 *
 * The whole article is right-to-left -- unlike Lane, whose prose is English
 * with Arabic spans inside it -- so direction is set once on the paragraph
 * rather than per token.
 */
export function MujamEntry({ tokens }: { tokens: string[] }) {
  return (
    <p dir="rtl" lang="ar" className="arabic-ui text-[15px] leading-loose text-ink">
      {tokens.map((tok, i) => {
        const kind = tok[0];
        const value = tok.slice(1);
        switch (kind) {
          case "q":
            // A Qur'anic quotation, set in the Qur'anic type and bracketed
            // the way a printed edition brackets one.
            return (
              <span key={i} className="uthmani text-accent">
                ﴿{value}﴾
              </span>
            );
          case "r":
            return (
              <span key={i} className="mx-1 text-xs text-muted/70">
                [{value}]
              </span>
            );
          case "h":
            return (
              <q key={i} className="text-ink/90">
                {value}
              </q>
            );
          case "b":
            // A sense break. The source marks these with `|`; rendering one
            // as a visible separator rather than a paragraph keeps a long
            // article from becoming a wall of disconnected fragments.
            return (
              <span key={i} className="mx-1.5 select-none text-muted/40">
                ·
              </span>
            );
          default:
            return <Fragment key={i}>{value}</Fragment>;
        }
      })}
    </p>
  );
}
