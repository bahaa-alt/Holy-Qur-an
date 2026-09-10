"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllStats } from "@/lib/games/store";
import { useT } from "@/lib/i18n/LanguageContext";
import type { GameId, GameStats } from "@/lib/games/types";
import type { Dict } from "@/lib/i18n/types";

interface GameCard {
  id: GameId;
  href: string;
  title: (t: Dict) => string;
  description: (t: Dict) => string;
}

const GAME_CARDS: GameCard[] = [
  {
    id: "root-frequency",
    href: "/games/root-frequency/",
    title: (t) => t.rootFrequencyGame.title,
    description: (t) => t.rootFrequencyGame.description,
  },
  {
    id: "root-meaning",
    href: "/games/root-meaning/",
    title: (t) => t.rootMeaningGame.title,
    description: (t) => t.rootMeaningGame.description,
  },
  {
    id: "lemma-root",
    href: "/games/lemma-root/",
    title: (t) => t.lemmaRootGame.title,
    description: (t) => t.lemmaRootGame.description,
  },
  {
    id: "fill-blank",
    href: "/games/fill-blank/",
    title: (t) => t.fillBlankGame.title,
    description: (t) => t.fillBlankGame.description,
  },
];

export function GamesHub() {
  const t = useT();
  const [stats, setStats] = useState<Partial<Record<GameId, GameStats>>>({});

  useEffect(() => {
    // One-time hydration from localStorage (unavailable during SSR/static
    // export, so the initial render always shows no stats) -- not a subscription.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(getAllStats());
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {GAME_CARDS.map((card) => {
        const cardStats = stats[card.id];
        return (
          <Link
            key={card.id}
            href={card.href}
            className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent"
          >
            <h2 className="text-sm font-medium text-ink">{card.title(t)}</h2>
            <p className="mt-1 text-xs text-muted">{card.description(t)}</p>
            {cardStats && cardStats.played > 0 && (
              <p className="mt-2 text-xs text-muted">
                {t.gamesHub.played(cardStats.played)} · {t.gamesHub.bestStreak(cardStats.bestStreak)}
              </p>
            )}
            <p className="mt-3 text-sm text-accent">{t.gamesHub.play}</p>
          </Link>
        );
      })}
    </div>
  );
}
