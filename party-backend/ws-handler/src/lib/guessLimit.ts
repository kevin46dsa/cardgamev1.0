import { hit, peekHits } from "@party/shared/src/db";
import type { Ctx } from "./ctx";

export const GUESS_WINDOW_SEC = 600;
export const MAX_MISSES_PER_WINDOW = 20;
export const MAX_PAIR_CODES_PER_WINDOW = 20;
/** Error codes that mean "a wrong room code, token or pairing code was tried". */
export const MISS_CODES: readonly string[] = ["ROOM_NOT_FOUND", "TOKEN_INVALID", "PAIR_INVALID"];

const missKey = (ip: string) => `miss:${ip}`;

/** True once this IP has used up its wrong guesses for the window (successful lookups never count). */
export async function isGuessBlocked(ip: string, limit = MAX_MISSES_PER_WINDOW): Promise<boolean> {
  return (await peekHits(missKey(ip), GUESS_WINDOW_SEC)) >= limit;
}

/** Counts one wrong guess against this IP. */
export const recordMiss = (ip: string) => hit(missKey(ip), GUESS_WINDOW_SEC, MAX_MISSES_PER_WINDOW);

/** Counts one pairing-code request from this IP; `allowed` is false past the limit. */
export const pairCodeRate = (ip: string, limit = MAX_PAIR_CODES_PER_WINDOW) => hit(`pair:${ip}`, GUESS_WINDOW_SEC, limit);

/** Copy of `ctx` whose replies to the caller also count a miss when they are a wrong-guess error. */
export function withMissCounting(ctx: Ctx): Ctx {
  return {
    ...ctx,
    send: async (to, body) => {
      if (to === ctx.connectionId && body.event === "error" && MISS_CODES.includes(body.code)) await recordMiss(ctx.sourceIp);
      return ctx.send(to, body);
    },
  };
}
