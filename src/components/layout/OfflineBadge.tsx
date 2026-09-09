"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBadge() {
  // Check `window`, not `navigator`: recent Node.js versions expose a
  // global `navigator` during SSR (for API parity with browsers), but it
  // has no `onLine` property, so `navigator.onLine` there is `undefined`
  // -- falsy, which used to make this component render its "Offline mode"
  // markup on the server and mismatch on hydration. `window` is never
  // defined in Node, so this reliably detects the browser.
  const [online, setOnline] = useState(() => (typeof window === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted">
      <WifiOff size={13} />
      Offline mode
    </div>
  );
}
