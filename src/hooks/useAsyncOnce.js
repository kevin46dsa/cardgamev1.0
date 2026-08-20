import { useEffect, useState } from "react";

/**
 * Runs an async function on mount (and whenever deps change), tracking
 * loading/error/data. Generalizes the repeated
 * `useEffect(() => { try { ... } catch { console.log } }, [])` fetch pattern.
 *
 * @param {() => Promise<any>} asyncFn
 * @param {any[]} deps
 */
export function useAsyncOnce(asyncFn, deps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    asyncFn()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
