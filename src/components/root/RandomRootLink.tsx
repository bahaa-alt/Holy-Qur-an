"use client";

import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";

export function RandomRootLink({ roots }: { roots: string[] }) {
  const router = useRouter();

  function goRandom() {
    const root = roots[Math.floor(Math.random() * roots.length)];
    router.push(`/root/${encodeURIComponent(root)}/`);
  }

  return (
    <button
      type="button"
      onClick={goRandom}
      className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-strong"
    >
      <Shuffle size={14} /> Random root
    </button>
  );
}
