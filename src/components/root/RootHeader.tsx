import type { ReactNode } from "react";
import type { RootSummary } from "@/lib/root/summary";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xl font-semibold text-ink sm:text-2xl">{value.toLocaleString()}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

export function RootHeader({ summary, actions }: { summary: RootSummary; actions?: ReactNode }) {
  const root = summary.root ?? "";

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Root</p>
          <p className="arabic-ui mt-1 text-left text-4xl font-semibold tracking-widest text-ink sm:text-5xl">
            {[...root].join(" ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {summary.bw && <p className="font-mono text-sm text-muted">/{summary.bw}/</p>}
          {actions}
        </div>
      </div>

      {summary.glossFull && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink">
          <span className="font-medium">Meaning (after Lane&apos;s Lexicon): </span>
          {summary.glossFull}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
        <Stat label="Total occurrences" value={summary.total} />
        <Stat label="Derived lemmas" value={summary.lemmaCount} />
        <Stat label="Distinct forms" value={summary.formCount} />
        <Stat label="Verses" value={summary.verseCount} />
      </div>
    </div>
  );
}
