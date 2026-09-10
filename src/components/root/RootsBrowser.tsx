"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { normalize } from "@/lib/arabic/normalize";
import { ARABIC_ALPHABET } from "@/lib/arabic/letters";
import { classifyRootShape, ROOT_SHAPE_LABELS, ROOT_SHAPE_ORDER, type RootShape } from "@/lib/morphology/rootShape";

interface RootRow {
  ar: string;
  key: string;
  count: number;
}

type GroupMode = "letter" | "shape";

export function RootsBrowser({ roots }: { roots: RootRow[] }) {
  const [query, setQuery] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("letter");

  const letterGroups = useMemo(() => {
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

  const shapeGroups = useMemo(() => {
    const map = new Map<RootShape, RootRow[]>();
    for (const shape of ROOT_SHAPE_ORDER) map.set(shape, []);
    for (const r of roots) {
      map.get(classifyRootShape(r.ar))!.push(r);
    }
    return map;
  }, [roots]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (q === "") return null;
    return roots.filter((r) => r.key.includes(q)).sort((a, b) => b.count - a.count);
  }, [query, roots]);

  const groups = groupMode === "letter" ? letterGroups : shapeGroups;
  const groupLabel = (key: string) => (groupMode === "letter" ? key : ROOT_SHAPE_LABELS[key as RootShape]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter roots…"
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setGroupMode("letter")}
            className={`rounded-md px-2.5 py-1 ${groupMode === "letter" ? "bg-accent text-accent-fg" : "text-muted"}`}
          >
            By letter
          </button>
          <button
            type="button"
            onClick={() => setGroupMode("shape")}
            className={`rounded-md px-2.5 py-1 ${groupMode === "shape" ? "bg-accent text-accent-fg" : "text-muted"}`}
          >
            By shape
          </button>
        </div>
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
            .map(([key, list]) => (
              <div key={key}>
                <h2 className="inline-flex items-center gap-2">
                  <span
                    className={
                      groupMode === "letter"
                        ? "arabic-ui text-left text-lg font-semibold text-accent"
                        : "text-sm font-semibold text-accent"
                    }
                  >
                    {groupLabel(key)}
                  </span>
                  <span className="text-xs font-normal text-muted">{list.length.toLocaleString()} roots</span>
                </h2>
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
