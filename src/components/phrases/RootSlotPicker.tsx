"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { normalize } from "@/lib/arabic/normalize";

export interface RootSlotOption {
  ar: string;
  key: string;
  count: number;
}

export function RootSlotPicker({
  label,
  roots,
  selected,
  onChange,
}: {
  label: string;
  roots: RootSlotOption[];
  selected: string | null;
  onChange: (root: string | null) => void;
}) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (q === "") return [];
    return roots
      .filter((r) => r.key.includes(q))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [query, roots]);

  return (
    <div className="min-w-[220px] flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      {selected ? (
        <div className="mt-2 flex items-center gap-2">
          <span className="arabic-ui inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-lg text-ink">
            {selected}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Clear ${label}`}
            className="text-muted hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
            <Search size={14} className="text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a root…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            />
          </div>
          {matches.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matches.map((r) => (
                <button
                  key={r.ar}
                  type="button"
                  onClick={() => {
                    onChange(r.ar);
                    setQuery("");
                  }}
                  className="arabic-ui inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  {r.ar}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
