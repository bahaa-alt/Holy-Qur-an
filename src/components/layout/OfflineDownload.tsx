"use client";

import { useState } from "react";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { prefetchAll } from "@/lib/data/loader";

export function OfflineDownload({ roots }: { roots: string[] }) {
  const [state, setState] = useState<"idle" | "downloading" | "done">("idle");
  const [progress, setProgress] = useState(0);

  async function start() {
    setState("downloading");
    await prefetchAll(roots, (p) => setProgress(Math.round((p.loaded / p.total) * 100)));
    setState("done");
  }

  if (state === "done") {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent">
        <CheckCircle2 size={16} /> Downloaded for offline use.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={state === "downloading"}
      className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-70"
    >
      {state === "downloading" ? (
        <>
          <Loader2 size={15} className="animate-spin" /> Downloading… {progress}%
        </>
      ) : (
        <>
          <Download size={15} /> Download everything for offline use
        </>
      )}
    </button>
  );
}
