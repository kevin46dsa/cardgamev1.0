import { finish } from "./reconcile";
import type { GameState, Res, Rng } from "./types";
import { clone, find } from "./util";

export function kickPlayer(state: GameState, byId: string, targetId: string, now: number, rng: Rng): Res {
  if (byId !== state.hostId) return { error: "NOT_HOST" };
  if (targetId === byId || !find(state, targetId)) return { error: "BAD_REQUEST" };
  const s = clone(state);
  const p = find(s, targetId)!;
  p.kicked = true;
  p.online = false;
  p.pending = true;
  delete p.offlineSince;
  return finish(s, { now, rng, promptIds: [] }, [{ type: "kicked", playerId: targetId }, { type: "players" }]);
}
