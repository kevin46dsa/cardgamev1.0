import { toLobby } from "./toLobby";
import type { GameState, Res } from "./types";
import { clone } from "./util";

// endGame / playAgain: host or TV. Same players, brackets and hills cleared; players who had left are dropped.
export function backToLobby(state: GameState, byId: string): Res {
  if (byId !== state.hostId && byId !== "tv") return { error: "NOT_HOST" };
  const s = clone(state);
  toLobby(s, false);
  s.players = s.players.filter((p) => !p.left);
  return { state: s, events: [{ type: "lobby", reason: "playAgain" }, { type: "players" }] };
}
