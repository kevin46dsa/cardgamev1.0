import { finish } from "./reconcile";
import type { GameState, Res, Rng } from "./types";
import { clone, find } from "./util";

// "Leave": in the lobby the player is deleted; in a game they are marked left (out of brackets, stored hill kept,
// can rejoin before the Finale). A contestant forfeits immediately; the host is handed over immediately.
export function removePlayer(state: GameState, id: string, now: number, rng: Rng): Res {
  if (!find(state, id)) return { error: "BAD_REQUEST" };
  const s = clone(state);
  if (s.phase === "lobby") s.players = s.players.filter((p) => p.id !== id);
  else {
    const p = find(s, id)!;
    p.left = true;
    p.online = false;
    p.pending = true;
    delete p.offlineSince;
  }
  return finish(s, { now, rng, promptIds: [] }, [{ type: "players" }]);
}
