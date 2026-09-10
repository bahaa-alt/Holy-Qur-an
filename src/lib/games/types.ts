export type GameId = "root-meaning" | "lemma-root" | "root-frequency" | "fill-blank";

export interface GameStats {
  played: number;
  correct: number;
  /** current correct-in-a-row streak */
  streak: number;
  bestStreak: number;
}

export const GAME_IDS: readonly GameId[] = ["root-meaning", "lemma-root", "root-frequency", "fill-blank"];
