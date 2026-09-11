"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import { PhraseTextSearch } from "./PhraseTextSearch";
import { PhraseSearch } from "@/components/phrases/PhraseSearch";
import { CompareView } from "@/components/compare/CompareView";
import type { RootSlotOption } from "@/components/phrases/RootSlotPicker";
import type { CompareRootRow } from "@/components/compare/RootPicker";

type Tab = "search" | "phrases" | "compare";

const TAB_CLASS = (active: boolean) => `rounded-md px-3 py-1.5 ${active ? "bg-accent text-accent-fg" : "text-muted"}`;

/**
 * Text search, phrase-pattern search, and root comparison used to be three
 * separate nav items; they're closely related research tools, so this
 * combines them into one page with a tab switcher instead. Each tab embeds
 * the exact same component the old standalone page rendered (PhraseTextSearch,
 * PhraseSearch, CompareView) -- unmodified, so their own URL-sync effects
 * (?q= and ?roots=) keep working exactly as before, they just don't fire
 * while a different tab has unmounted them.
 *
 * /search/advanced/, /phrases/ and /compare/ still exist as standalone
 * routes (not removed) so any existing bookmark/deep-link keeps working --
 * this hub is purely an additional, decluttered entry point reachable from
 * the nav bar.
 */
export function SearchHubContent({
  phraseRoots,
  compareRoots,
}: {
  phraseRoots: RootSlotOption[];
  compareRoots: CompareRootRow[];
}) {
  const t = useT();
  // Starts on "search" to match the prerendered static HTML -- corrected in
  // a post-mount effect, same discipline as CompareView's own URL restore.
  // Detects which tab to land on from whichever query param a deep link
  // carries (?roots= from an old /compare/ link, ?q= from an old /search/
  // link) rather than introducing a third, competing "?tab=" param that
  // would fight with CompareView/PhraseTextSearch's own URL syncing.
  const [tab, setTab] = useState<Tab>("search");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("roots")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from the URL, not a subscription; see comment above.
      setTab("compare");
    }
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.searchHub.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.searchHub.subtitle}</p>
      </div>

      <div className="flex w-fit rounded-lg border border-border p-0.5 text-sm">
        <button type="button" onClick={() => setTab("search")} className={TAB_CLASS(tab === "search")}>
          {t.searchHub.tabSearch}
        </button>
        <button type="button" onClick={() => setTab("phrases")} className={TAB_CLASS(tab === "phrases")}>
          {t.searchHub.tabPhrases}
        </button>
        <button type="button" onClick={() => setTab("compare")} className={TAB_CLASS(tab === "compare")}>
          {t.searchHub.tabCompare}
        </button>
      </div>

      {tab === "search" && (
        <div className="space-y-3">
          <p className="text-sm">
            <Link href="/search/advanced/" className="text-accent hover:text-accent-strong">
              {t.searchHub.advancedSearchLinkLabel}
            </Link>
          </p>
          <PhraseTextSearch />
        </div>
      )}
      {tab === "phrases" && <PhraseSearch roots={phraseRoots} />}
      {tab === "compare" && <CompareView roots={compareRoots} />}
    </div>
  );
}
