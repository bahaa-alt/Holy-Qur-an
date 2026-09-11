"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { activateNewServiceWorker, registerServiceWorker } from "@/lib/pwa/registerSW";
import { useT } from "@/lib/i18n/LanguageContext";

export function ServiceWorkerRegister() {
  const t = useT();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    registerServiceWorker(() => setUpdateAvailable(true));
  }, []);

  // Apply the update on its own after a short grace period rather than
  // waiting indefinitely for someone to notice this small floating button
  // -- a build gets deployed often, and a visitor who never clicks it (or
  // is using this as an installed app with no obvious "reload" affordance)
  // would otherwise stay stuck on an old cached version, potentially
  // missing assets an even-older service worker never learned to fetch.
  // The button still lets anyone update immediately instead of waiting.
  useEffect(() => {
    if (!updateAvailable) return;
    const timer = setTimeout(() => activateNewServiceWorker(), 4000);
    return () => clearTimeout(timer);
  }, [updateAvailable]);

  if (!updateAvailable) return null;

  return (
    <button
      type="button"
      onClick={() => activateNewServiceWorker()}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-lg"
    >
      <RefreshCw size={14} className="text-accent" />
      {t.serviceWorker.updateAvailable}
    </button>
  );
}
