import Link from "next/link";
import { buildKwicLine } from "@/lib/kwic";
import type { SurahMeta } from "@/lib/data/types";

export function KwicRow({
  surahMeta,
  ayah,
  tokens,
  wordIndex,
}: {
  surahMeta: SurahMeta;
  ayah: number;
  tokens: string[];
  wordIndex: number;
}) {
  const line = buildKwicLine(tokens, wordIndex);

  return (
    <div className="flex items-baseline gap-3 border-b border-border/60 py-2 text-sm last:border-0">
      <Link
        href={`/surah/${surahMeta.n}/?ayah=${ayah}`}
        className="w-16 shrink-0 text-xs text-muted hover:text-accent"
      >
        <bdi>
          {surahMeta.n}:{ayah}
        </bdi>
      </Link>
      <p className="uthmani min-w-0 flex-1 truncate">
        {line.truncatedBefore && <span className="text-muted">… </span>}
        {line.before && <span className="text-muted">{line.before} </span>}
        <span className="word-emphasis">{line.match}</span>
        {line.after && <span className="text-muted"> {line.after}</span>}
        {line.truncatedAfter && <span className="text-muted"> …</span>}
      </p>
    </div>
  );
}
