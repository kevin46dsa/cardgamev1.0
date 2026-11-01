import { useEffect } from "react";

/**
 * Keeps the screen on while `active`, where the Screen Wake Lock API exists. The lock is released by the
 * browser when the tab hides, so it is re-requested when the tab becomes visible again.
 * @param {boolean} active
 */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !navigator.wakeLock) return undefined;
    let sentinel = null;
    let cancelled = false;
    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) lock.release().catch(() => {});
        else sentinel = lock;
      } catch {
        /* denied (battery saver, unsupported context): not critical */
      }
    };
    const onVisible = () => {
      if (!document.hidden) request();
    };
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
