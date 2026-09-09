"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "install-prompt-dismissed";
const VISIT_COUNT_KEY = "visit-count";

/** Read-only: was the prompt dismissed before, and is this at least the 2nd visit? */
function readEligibility(): boolean {
  try {
    if (localStorage.getItem(DISMISSED_KEY) === "1") return false;
    const priorVisits = Number(localStorage.getItem(VISIT_COUNT_KEY) ?? "0");
    return priorVisits >= 1; // this visit will be recorded as the 2nd+ by the effect below
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [eligible] = useState(readEligibility);

  // Records this visit exactly once per mount. A side effect on an external
  // system (localStorage), not a setState call, so it's fine directly in the effect.
  useEffect(() => {
    try {
      const visits = Number(localStorage.getItem(VISIT_COUNT_KEY) ?? "0") + 1;
      localStorage.setItem(VISIT_COUNT_KEY, String(visits));
    } catch {
      // storage unavailable -- eligibility just won't advance next time either
    }
  }, []);

  useEffect(() => {
    if (!eligible) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [eligible]);

  if (!eligible || dismissed || !deferredEvent) return null;

  async function install() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  }

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface p-3 shadow-lg sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-96 sm:-translate-x-1/2 sm:rounded-xl sm:border">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-accent/10 p-2 text-accent">
          <Download size={18} />
        </div>
        <div className="flex-1 text-sm">
          <p className="font-medium text-ink">Install for offline use</p>
          <p className="mt-0.5 text-muted">Add to your home screen to use it like a native app, offline.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={install}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
            >
              Not now
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="text-muted hover:text-ink">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
