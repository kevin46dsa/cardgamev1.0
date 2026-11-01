import { type ErrorCode, type GameState, MAX_ANSWER } from "./types";

// Role / phase / length checks. Returns the normalized text and the storage key to save it under.
// Late answers (now past the deadline) never count. Profanity is the handler's job (ANSWER_BLOCKED).
export function validateAnswer(state: GameState, playerId: string, text: string, now: number): { ok: true; text: string; ak: string } | { error: ErrorCode } {
  const m = state.match;
  if (state.phase !== "write" || !m || state.pausedAt !== undefined || (state.phaseEndsAt > 0 && now > state.phaseEndsAt)) return { error: "WRONG_PHASE" };
  if (m.a !== playerId && m.b !== playerId) return { error: "NOT_CONTESTANT" };
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) return { error: "ANSWER_EMPTY" };
  if (t.length > MAX_ANSWER) return { error: "ANSWER_TOO_LONG" };
  return { ok: true, text: t, ak: m.ak };
}
