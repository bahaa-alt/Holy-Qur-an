"use client";

import { useEffect, useState } from "react";

/**
 * A piece of client state mirrored to one URL query parameter, so the view
 * it drives can be saved, exported and reopened.
 *
 * CompareTab introduced this pattern for its own `scope` parameter --
 * hydrate once from the URL after mount, then keep the URL in sync with
 * every change -- because a Save or an Export is only as good as the link
 * it carries: if the link cannot reopen the same view, "cite as" is a
 * promise the button cannot keep. Generalized here so Rhyme's scope,
 * Collocations' root and scope, and the Insights page's own active tab
 * do not each reinvent the same two effects.
 *
 * Hydration happens in an effect, not in useState's initializer, because
 * the first render must match the prerendered static HTML -- which never
 * has a query string -- or React logs a hydration mismatch.
 */
export function useUrlParam<T>(
  param: string,
  initial: T,
  parse: (raw: string | null) => T | null,
  serialize: (value: T) => string | null,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const parsed = parse(new URLSearchParams(window.location.search).get(param));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from the URL, not a subscription.
    if (parsed !== null) setValue(parsed);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read this one param once, on mount.
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(window.location.href);
    const serialized = serialize(value);
    if (serialized === null) url.searchParams.delete(param);
    else url.searchParams.set(param, serialized);
    window.history.replaceState(null, "", url);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `serialize` is the caller's mapping for this param, not state to react to independently.
  }, [value, hydrated, param]);

  return [value, setValue];
}
