import { getRoom } from "./getRoom";
import { saveRoom } from "./saveRoom";

export type RoomResult<T> = { ok: true; meta: T } | { error: string };

const TRIES = 5;

// Load, apply a PURE fn, save with the version check; on a lost race reload and rerun fn (so fn must be
// re-runnable). Errors: ROOM_NOT_FOUND, ROOM_ENDED, whatever fn returns, or CONFLICT after 5 lost races.
export async function withRoom<T>(code: string, fn: (meta: T) => T | { error: string }): Promise<RoomResult<T>> {
  for (let i = 0; i < TRIES; i++) {
    const room = await getRoom<T>(code);
    if (!room) return { error: "ROOM_NOT_FOUND" };
    if (room.status === "ended") return { error: "ROOM_ENDED" };
    const next = fn(room.meta);
    if (next && typeof next === "object" && typeof (next as { error?: unknown }).error === "string") return next as { error: string };
    if (await saveRoom(code, next, room.version)) return { ok: true, meta: next as T };
    await new Promise((r) => setTimeout(r, 5 + Math.random() * 20)); // jitter so two losers do not collide again in lockstep
  }
  return { error: "CONFLICT" };
}
