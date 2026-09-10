import Link from "next/link";
import { HighlightedVerse } from "./HighlightedVerse";
import { AyahActions } from "./AyahActions";
import { RelatedVerses } from "./RelatedVerses";
import { SaveButton } from "@/components/notes/SaveButton";
import { useT } from "@/lib/i18n/LanguageContext";
import type { SurahMeta } from "@/lib/data/types";

export function AyahCard({
  surahMeta,
  ayah,
  tokens,
  translation,
  pickthall,
  highlightIndices,
  emphasisIndex,
}: {
  surahMeta: SurahMeta;
  ayah: number;
  tokens: string[];
  translation: string;
  pickthall?: string;
  highlightIndices: number[];
  emphasisIndex?: number;
}) {
  const t = useT();

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <Link
          href={`/surah/${surahMeta.n}/?ayah=${ayah}`}
          className="text-sm font-medium text-accent hover:text-accent-strong"
        >
          <bdi>
            {surahMeta.nameEn} {surahMeta.n}:{ayah}
          </bdi>
        </Link>
        <span className="arabic-ui text-sm text-muted">{surahMeta.nameAr}</span>
      </div>

      <div className="mt-3">
        <HighlightedVerse
          s={surahMeta.n}
          a={ayah}
          tokens={tokens}
          highlightIndices={highlightIndices}
          emphasisIndex={emphasisIndex}
        />
      </div>
      <p className="mt-2 text-sm text-muted">{translation}</p>
      {pickthall && (
        <p className="mt-1 text-sm text-muted/80">
          <span className="text-xs uppercase tracking-wide text-muted/60">{t.ayahCard.pickthallLabel}</span>
          {pickthall}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AyahActions
            arabic={tokens.join(" ")}
            translation={translation}
            pickthall={pickthall}
            surah={surahMeta.n}
            ayah={ayah}
          />
          <SaveButton
            id={`verse:${surahMeta.n}:${ayah}`}
            kind="verse"
            label={`${surahMeta.n}:${ayah}`}
            href={`/surah/${surahMeta.n}/?ayah=${ayah}`}
          />
        </div>
        <RelatedVerses s={surahMeta.n} a={ayah} />
      </div>
    </div>
  );
}
