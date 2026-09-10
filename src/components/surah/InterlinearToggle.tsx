"use client";

import { useInterlinearMode } from "@/lib/surah/ReadingModeContext";
import { useT } from "@/lib/i18n/LanguageContext";

export function InterlinearToggle() {
  const t = useT();
  const [interlinear, setInterlinear] = useInterlinearMode();

  return (
    <button
      type="button"
      onClick={() => setInterlinear(!interlinear)}
      className="text-xs text-accent hover:text-accent-strong"
    >
      {interlinear ? t.interlinearToggle.hide : t.interlinearToggle.show}
    </button>
  );
}
