import { useEffect, useState } from "react";
import { COUNTDOWN_REFRESH_MS } from "../config";
import { useParty } from "../state/PartyContext";

/**
 * Whole seconds left until a server deadline, rendered locally (no network).
 * @param {number|null|undefined} endsAt server ms
 * @returns {number|null}
 */
export function useCountdown(endsAt) {
  const { clock } = useParty();
  const compute = () => (endsAt ? Math.ceil(clock.remaining(endsAt) / 1000) : null);
  const [secs, setSecs] = useState(compute);
  useEffect(() => {
    setSecs(compute());
    if (!endsAt) return undefined;
    const handle = setInterval(() => setSecs(compute()), COUNTDOWN_REFRESH_MS);
    return () => clearInterval(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, clock]);
  return secs;
}
