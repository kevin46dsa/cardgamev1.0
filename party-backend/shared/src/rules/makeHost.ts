import type { GameState, Res } from "./types";
import { clone, find, isActive } from "./util";

export function makeHost(state: GameState, byId: string, targetId: string): Res {
  if (byId !== state.hostId) return { error: "NOT_HOST" };
  const t = find(state, targetId);
  if (!t || !isActive(t)) return { error: "BAD_REQUEST" };
  const s = clone(state);
  s.hostId = targetId;
  return { state: s, events: [{ type: "hostChanged", hostId: targetId }] };
}
