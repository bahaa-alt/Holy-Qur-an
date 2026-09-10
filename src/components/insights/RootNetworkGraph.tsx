"use client";

import { useMemo } from "react";
import { rootHref } from "@/lib/search/suggest";
import type { RootPairRow } from "@/lib/data/types";

const MAX_NODES = 24;
const VIEW_SIZE = 560;
const CENTER = VIEW_SIZE / 2;
const NODE_RADIUS = 200;
const LABEL_RADIUS = NODE_RADIUS + 26;
const MIN_DOT_R = 4;
const MAX_DOT_R = 14;

/**
 * A dependency-free circular node-link diagram of the strongest root
 * co-occurrence pairs: no force-layout library, just nodes placed evenly
 * around a circle (ordered by total connection weight so heavier nodes
 * spread out rather than cluster) with edges drawn between them, matching
 * this app's established "hand-rolled SVG/CSS, no chart library"
 * convention. Always weighted by raw co-occurrence count (not PMI) --
 * node size and edge weight are about how connected a root visually is,
 * which a metric that can go negative doesn't map onto cleanly.
 */
export function RootNetworkGraph({ pairs }: { pairs: readonly RootPairRow[] }) {
  const { nodes, edges, maxEdgeCount, maxWeight } = useMemo(() => {
    const weightByRoot = new Map<string, number>();
    for (const p of pairs) {
      weightByRoot.set(p.rootA, (weightByRoot.get(p.rootA) ?? 0) + p.count);
      weightByRoot.set(p.rootB, (weightByRoot.get(p.rootB) ?? 0) + p.count);
    }

    const topRoots = [...weightByRoot.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_NODES)
      .map(([root]) => root);
    const rootIndex = new Map(topRoots.map((root, i) => [root, i]));

    const nodes = topRoots.map((root, i) => {
      const angle = (2 * Math.PI * i) / topRoots.length - Math.PI / 2;
      return {
        root,
        angle,
        x: CENTER + NODE_RADIUS * Math.cos(angle),
        y: CENTER + NODE_RADIUS * Math.sin(angle),
        labelX: CENTER + LABEL_RADIUS * Math.cos(angle),
        labelY: CENTER + LABEL_RADIUS * Math.sin(angle),
        weight: weightByRoot.get(root) ?? 0,
      };
    });

    const edges = pairs
      .filter((p) => rootIndex.has(p.rootA) && rootIndex.has(p.rootB))
      .map((p) => ({ a: nodes[rootIndex.get(p.rootA)!], b: nodes[rootIndex.get(p.rootB)!], count: p.count }));

    const maxEdgeCount = edges.length > 0 ? Math.max(...edges.map((e) => e.count)) : 1;
    const maxWeight = nodes.length > 0 ? Math.max(...nodes.map((n) => n.weight)) : 1;

    return { nodes, edges, maxEdgeCount, maxWeight };
  }, [pairs]);

  if (nodes.length === 0) return null;

  return (
    <svg viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} className="mx-auto w-full max-w-xl" role="img" aria-label="Root co-occurrence network">
      {edges.map((e, i) => {
        const t = e.count / maxEdgeCount;
        return (
          <line
            key={i}
            x1={e.a.x}
            y1={e.a.y}
            x2={e.b.x}
            y2={e.b.y}
            className="stroke-accent"
            strokeWidth={0.5 + 3 * t}
            strokeOpacity={0.12 + 0.55 * t}
          >
            <title>
              {e.a.root} + {e.b.root}: {e.count.toLocaleString()}
            </title>
          </line>
        );
      })}
      {nodes.map((n) => {
        const r = MIN_DOT_R + (MAX_DOT_R - MIN_DOT_R) * Math.sqrt(n.weight / maxWeight);
        return (
          <a key={n.root} href={rootHref(n.root)}>
            <circle cx={n.x} cy={n.y} r={r} className="fill-accent" fillOpacity={0.85}>
              <title>{n.root}</title>
            </circle>
            <text
              x={n.labelX}
              y={n.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="arabic-ui fill-ink text-[13px] hover:fill-accent"
            >
              {n.root}
            </text>
          </a>
        );
      })}
    </svg>
  );
}
