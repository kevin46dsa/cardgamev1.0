import type { GameState, Res, TieChoice } from "./types";
import { clone } from "./util";

// Stores a tied contestant's choice in state. `earlyEnd` = both have chosen: call advance now.
export function chooseTieBreak(state: GameState, playerId: string, choice: TieChoice, now: number): Res {
  const m = state.match;
  if (state.phase !== "tiebreak" || !m || state.pausedAt !== undefined || now > state.phaseEndsAt) return { error: "WRONG_PHASE" };
  if (m.a !== playerId && m.b !== playerId) return { error: "NOT_CONTESTANT" };
  if (choice !== "reprompt" && choice !== "revote") return { error: "BAD_REQUEST" };
  const s = clone(state);
  const mm = s.match!;
  mm.choices = { ...mm.choices, [playerId]: choice };
  return { state: s, events: [], earlyEnd: !!mm.choices[mm.a] && !!mm.choices[mm.b] };
}
