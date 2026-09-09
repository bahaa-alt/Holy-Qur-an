"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { activateNewServiceWorker, registerServiceWorker } from "@/lib/pwa/registerSW";

export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    registerServiceWorker(() => setUpdateAvailable(true));
  }, []);

  if (!updateAvailable) return null;

  return (
    <button
      type="button"
      onClick={() => activateNewServiceWorker()}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-lg"
    >
      <RefreshCw size={14} className="text-accent" />
      Update available — reload
    </button>
  );
}
