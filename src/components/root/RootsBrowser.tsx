"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { normalize } from "@/lib/arabic/normalize";
import { ARABIC_ALPHABET } from "@/lib/arabic/letters";

interface RootRow {
  ar: string;
  key: string;
  count: number;
}

export function RootsBrowser({ roots }: { roots: RootRow[] }) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const map = new Map<string, RootRow[]>();
    for (const letter of ARABIC_ALPHABET) map.set(letter, []);
    for (const r of roots) {
      const first = r.key[0];
      const bucket = map.get(first);
      if (bucket) bucket.push(r);
      else map.set(first, [r]);
    }
    return map;
  }, [roots]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (q === "") return null;
    return roots.filter((r) => r.key.includes(q)).sort((a, b) => b.count - a.count);
  }, [query, roots]);

  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5">
        <Search size={16} className="text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter roots…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
        />
      </div>

      {filtered ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {filtered.length === 0 && <p className="text-sm text-muted">No roots match &quot;{query}&quot;.</p>}
          {filtered.map((r) => (
            <RootChip key={r.ar} root={r} />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {[...groups.entries()]
            .filter(([, list]) => list.length > 0)
            .map(([letter, list]) => (
              <div key={letter}>
                <h2 className="arabic-ui text-left text-lg font-semibold text-accent">{letter}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {list
                    .sort((a, b) => b.count - a.count)
                    .map((r) => (
                      <RootChip key={r.ar} root={r} />
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function RootChip({ root }: { root: RootRow }) {
  return (
    <Link
      href={`/root/${encodeURIComponent(root.ar)}/`}
      className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
    >
      <span>{root.ar}</span>
      <span className="text-xs text-muted">{root.count.toLocaleString()}</span>
    </Link>
  );
}
