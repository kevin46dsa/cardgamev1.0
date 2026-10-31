import { finish } from "./reconcile";
import type { GameState, Res, Rng } from "./types";
import { clone, find } from "./util";

// $disconnect: sets offlineSince. A contestant forfeits once GRACE_MS passes (checked by advance / nextDeadline).
export function markOffline(state: GameState, id: string, now: number, rng: Rng): Res {
  const p0 = find(state, id);
  if (!p0) return { error: "BAD_REQUEST" };
  if (!p0.online) return { state, events: [] };
  const s = clone(state);
  const p = find(s, id)!;
  p.online = false;
  p.offlineSince = now;
  return finish(s, { now, rng, promptIds: [] }, [{ type: "players" }]);
}
