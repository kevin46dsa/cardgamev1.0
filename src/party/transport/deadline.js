import { ADVANCE_FALLBACK_MS, DEADLINE_MARGIN_MS } from "../config";

/**
 * One timer per `nextDeadline`. When it fires we send `advance {phaseId}`: drivers (TV or host) at +0s,
 * everyone else at +3s. Re-arming with the same phase and deadline keeps the pending timer, and any newer
 * phase replaces it, which gives "only if no newer phaseId arrived" for free.
 * @param {{toLocal: (ms:number)=>number}} clock
 * @param {(phaseId:number)=>void} sendAdvance
 * @param {() => number} [nowFn]
 */
export function createDeadlineTimer(clock, sendAdvance, nowFn = Date.now) {
  let handle = null;
  let armed = null;

  const clear = () => {
    if (handle !== null) clearTimeout(handle);
    handle = null;
    armed = null;
  };

  return {
    /**
     * @param {{deadline: number|null, phaseId: number|undefined, driver: boolean}} p
     */
    arm({ deadline, phaseId, driver }) {
      if (deadline == null || phaseId == null) return clear();
      if (armed && armed.deadline === deadline && armed.phaseId === phaseId && armed.driver === driver) return;
      clear();
      armed = { deadline, phaseId, driver };
      const delay = Math.max(0, clock.toLocal(deadline) - nowFn()) + DEADLINE_MARGIN_MS + (driver ? 0 : ADVANCE_FALLBACK_MS);
      handle = setTimeout(() => {
        handle = null;
        armed = null;
        sendAdvance(phaseId);
      }, delay);
    },
    clear,
  };
}
