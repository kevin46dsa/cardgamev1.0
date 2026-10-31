import { startMatch, forfeitAbsent } from "./match";
import { planNext } from "./planNext";
import { type EngineEvent, type GameState, type Res, type Rng, MIN_PLAYERS } from "./types";
import { clone, isActive } from "./util";

// Host or TV ('tv') starts. Needs 3 active players. Hills reset; Act 1 is planned and its first match starts (intro).
export function startGame(state: GameState, byId: string, promptIds: string[], now: number, rng: Rng): Res {
  if (byId !== state.hostId && byId !== "tv") return { error: "NOT_HOST" };
  if (state.phase !== "lobby") return { error: "GAME_STARTED" };
  if (state.players.filter(isActive).length < MIN_PLAYERS) return { error: "NOT_ENOUGH_PLAYERS" };
  const s = clone(state);
  for (const p of s.players) { p.hill = null; delete p.pending; delete p.forfeited; }
  const events: EngineEvent[] = [];
  const c = { now, rng, promptIds };
  planNext(s, rng);
  startMatch(s, c, events);
  forfeitAbsent(s, c, events);
  return { state: s, events };
}
