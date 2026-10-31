/**
 * Server clock offset. offset = serverNow - Date.now(), so deadlines (server ms) can be rendered locally.
 * @param {() => number} [nowFn] local clock, injectable for tests
 */
export function createClock(nowFn = Date.now) {
  let offset = 0;
  return {
    /** Record the offset from a server timestamp. */
    sync(serverNow) {
      if (Number.isFinite(serverNow)) offset = serverNow - nowFn();
    },
    /** Current server time in ms. */
    now: () => nowFn() + offset,
    /** Convert a server timestamp to a local timestamp. */
    toLocal: (serverMs) => serverMs - offset,
    /** Milliseconds until a server deadline (never negative). */
    remaining: (serverMs) => Math.max(0, serverMs - (nowFn() + offset)),
  };
}
