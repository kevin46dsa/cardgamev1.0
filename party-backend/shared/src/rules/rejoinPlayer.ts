import { finish } from "./reconcile";
import type { GameState, Res, Rng } from "./types";
import { clone, find } from "./util";

// Welcome back (token already checked by the handler). Allowed any time, even in the Finale (they watch).
// A player who had left or was dropped from the brackets is crowd (pending) and returns to their stored hill at the
// next Act 2. A player who only lost connection briefly just carries on. Kicked players get KICKED.
export function rejoinPlayer(state: GameState, id: string, now: number, rng: Rng): Res {
  const p0 = find(state, id);
  if (!p0) return { error: "TOKEN_INVALID" };
  if (p0.kicked) return { error: "KICKED" };
  const s = clone(state);
  const p = find(s, id)!;
  p.online = true;
  p.connectedAt = now;
  delete p.offlineSince;
  if (p.left) {
    delete p.left;
    if (s.phase !== "lobby") p.pending = true;
  }
  return finish(s, { now, rng, promptIds: [] }, [{ type: "players" }]);
}
