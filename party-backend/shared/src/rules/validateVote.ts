import type { ErrorCode, GameState } from "./types";
import { find, isActive } from "./util";

// Crowd only, one vote each (the handler stores it under `vk`, replacing any earlier one).
export function validateVote(state: GameState, voterId: string, side: string, now: number): { ok: true; vk: string } | { error: ErrorCode } {
  const m = state.match;
  if (state.phase !== "vote" || !m || state.pausedAt !== undefined || (state.phaseEndsAt > 0 && now > state.phaseEndsAt)) return { error: "WRONG_PHASE" };
  if (m.a === voterId || m.b === voterId) return { error: "CONTESTANT_CANNOT_VOTE" };
  const p = find(state, voterId);
  if (!p || !isActive(p) || (side !== "A" && side !== "B")) return { error: "BAD_REQUEST" };
  return { ok: true, vk: m.vk };
}
