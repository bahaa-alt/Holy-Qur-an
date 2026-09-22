"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import { StudyDetail } from "./StudyDetail";
import { StudyList } from "./StudyList";
import type { SurahMeta } from "@/lib/data/types";

const ID_PARAM = "id";

function readId(): string | null {
  return new URLSearchParams(window.location.search).get(ID_PARAM);
}

/**
 * A single static route (`/studies/`) showing either every study or one of
 * them, keyed by `?id=` -- the same shape QueryPageContent uses for `?q=`.
 * A study's id is assigned client-side when it is created, so (unlike a
 * root or word page) there is no set of ids known at build time to
 * generate real per-study routes for.
 */
export function StudiesPageContent({ surahs }: { surahs: SurahMeta[] }) {
  const t = useT();
  const [id, setId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from the URL, not a subscription.
    setId(readId());
    setHydrated(true);
    const onPopState = () => setId(readId());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const open = useCallback((studyId: string | null) => {
    const url = new URL(window.location.href);
    if (studyId) url.searchParams.set(ID_PARAM, studyId);
    else url.searchParams.delete(ID_PARAM);
    window.history.pushState(null, "", url);
    setId(studyId);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.studiesPage.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.studiesPage.subtitle}</p>
      </div>
      {!hydrated ? null : id ? (
        <StudyDetail studyId={id} surahs={surahs} onClose={() => open(null)} />
      ) : (
        <StudyList onOpen={open} />
      )}
    </div>
  );
}
