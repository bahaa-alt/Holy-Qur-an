"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { isSaved, removeItem, saveItem } from "@/lib/notes/store";
import type { SavedKind } from "@/lib/notes/types";

export function SaveButton({
  id,
  kind,
  label,
  href,
}: {
  id: string;
  kind: SavedKind;
  label: string;
  href: string;
}) {
  // Starts false to match the prerendered static HTML (localStorage doesn't
  // exist during SSR/static export, so the initial markup is always
  // "unsaved"). Reading the real value in useState's lazy initializer
  // instead would make the client's first render diverge from that markup
  // whenever the item actually is saved, tripping a hydration mismatch --
  // the same bug already hit and fixed once this round in CompareView.
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isSaved(id)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage, not a subscription; see comment above.
      setSaved(true);
    }
  }, [id]);

  function toggle() {
    if (saved) {
      removeItem(id);
      setSaved(false);
    } else {
      saveItem({ id, kind, label, href, note: "" });
      setSaved(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {saved ? <BookmarkCheck size={13} className="text-accent" /> : <Bookmark size={13} />}
      {saved ? "Saved" : "Save"}
    </button>
  );
}
