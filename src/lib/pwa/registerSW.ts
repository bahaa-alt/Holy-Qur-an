/**
 * Registers the service worker (built by scripts/build-sw.ts into
 * /sw.js at postbuild) and wires up the "update available" flow.
 * No-ops outside a browser with SW support.
 */
export function registerServiceWorker(onUpdateAvailable?: () => void): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  const doRegister = () => {
    navigator.serviceWorker
      .register(`${basePath}/sw.js`)
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
  };

  // This runs from a React effect after hydration, by which point the
  // window's "load" event has very often already fired (a static export
  // page loads fast) -- attaching a "load" listener at that point would
  // never call it back. Register immediately if the document is already
  // fully loaded, and only wait for "load" otherwise.
  if (document.readyState === "complete") {
    doRegister();
  } else {
    window.addEventListener("load", doRegister);
  }

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
