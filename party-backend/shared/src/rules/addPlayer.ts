import { finish } from "./reconcile";
import { type GameState, type Rng, type Res, MAX_PLAYERS } from "./types";
import { clone } from "./util";

// New player. In a running game they are crowd (hill null, pending) and enter the Comeback hill at the next Act 2.
// Names: 1 to 12 characters after trim, unique ignoring case (left players keep their name reserved).
export function addPlayer(state: GameState, id: string, name: string, now: number, rng: Rng): Res {
  const n = (name ?? "").trim();
  if (!n || n.length > 12) return { error: "NAME_INVALID" };
  if (state.act === 4) return { error: "FINALE_IN_PROGRESS" };
  if (state.players.some((p) => p.id === id)) return { error: "BAD_REQUEST" };
  if (state.players.filter((p) => !p.kicked).length >= MAX_PLAYERS) return { error: "ROOM_FULL" };
  if (state.players.some((p) => p.name.toLowerCase() === n.toLowerCase())) return { error: "NAME_TAKEN" };
  const s = clone(state);
  const late = s.phase !== "lobby" && s.phase !== "final";
  s.players.push({ id, name: n, hill: null, online: true, connectedAt: now, ...(late ? { pending: true as const } : {}) });
  return finish(s, { now, rng, promptIds: [] }, [{ type: "players" }]);
}
