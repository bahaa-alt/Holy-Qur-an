"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { normalize } from "@/lib/arabic/normalize";

const MAX_SELECTED = 3;

export interface CompareRootRow {
  ar: string;
  key: string;
  count: number;
  glossShort: string;
}

export function RootPicker({
  roots,
  selected,
  onChange,
}: {
  roots: CompareRootRow[];
  selected: string[];
  onChange: (roots: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const atLimit = selected.length >= MAX_SELECTED;

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (q === "") return [];
    return roots
      .filter((r) => !selected.includes(r.ar) && r.key.includes(q))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [query, roots, selected]);

  function add(root: string) {
    if (atLimit || selected.includes(root)) return;
    onChange([...selected, root]);
    setQuery("");
  }

  function remove(root: string) {
    onChange(selected.filter((r) => r !== root));
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-ink">Roots to compare</h2>
      <p className="mt-1 text-xs text-muted">Pick up to {MAX_SELECTED} roots to compare side by side.</p>

      {selected.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selected.map((root) => (
            <span
              key={root}
              className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-ink"
            >
              {root}
              <button
                type="button"
                onClick={() => remove(root)}
                aria-label={`Remove ${root}`}
                className="text-muted hover:text-ink"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      {!atLimit && (
        <div className="mt-4">
          <div className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a root to add…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            />
          </div>
          {matches.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {matches.map((r) => (
                <button
                  key={r.ar}
                  type="button"
                  onClick={() => add(r.ar)}
                  className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  <span>{r.ar}</span>
                  <span className="text-xs text-muted">{r.count.toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
