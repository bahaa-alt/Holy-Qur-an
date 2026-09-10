import Link from "next/link";

/**
 * A compact 114-cell strip (one per surah, in Qur'an order) giving an
 * instant "where does this concentrate" shape -- early/late, clustered vs
 * spread -- that the exact-numbers SurahDistribution list doesn't convey
 * at a glance. Purely presentational (no i18n text, just numbers), so it
 * needs no client boundary and renders directly in a server component.
 */
export function SurahHeatmapStrip({ counts, label }: { counts: readonly number[]; label?: string }) {
  const max = Math.max(...counts, 1);
  return (
    <div className="flex items-center gap-2">
      {label && <span className="arabic-ui w-16 shrink-0 truncate text-xs text-muted">{label}</span>}
      <div className="flex h-4 flex-1 gap-px overflow-hidden rounded">
        {counts.map((count, i) => {
          const n = i + 1;
          const opacity = count === 0 ? 0.08 : 0.15 + 0.85 * (count / max);
          return (
            <Link
              key={n}
              href={`/surah/${n}/`}
              title={`${n}: ${count.toLocaleString()}`}
              className="block flex-1 bg-accent"
              style={{ opacity }}
            />
          );
        })}
      </div>
    </div>
  );
}
