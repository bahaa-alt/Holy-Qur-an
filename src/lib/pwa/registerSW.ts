/**
 * Registers the service worker (built by scripts/build-sw.ts into
 * /sw.js at postbuild) and wires up the "update available" flow.
 * No-ops outside a browser with SW support.
 */
export function registerServiceWorker(onUpdateAvailable?: () => void): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              onUpdateAvailable?.();
            }
          });
        });
      })
      .catch(() => {
        // registration failing (e.g. unsupported context) shouldn't break the app
      });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

/** Tells an active service worker to skip waiting and take control immediately. */
export function activateNewServiceWorker(): void {
  navigator.serviceWorker.getRegistration().then((registration) => {
    registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
}
