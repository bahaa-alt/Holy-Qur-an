"use client";

import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";

export function RandomRootLink({ roots }: { roots: string[] }) {
  const t = useT();
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
      <Shuffle size={14} /> {t.randomRootLink.label}
    </button>
  );
}
