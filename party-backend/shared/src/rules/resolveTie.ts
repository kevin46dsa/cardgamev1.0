import type { Match, Rng, TieChoice } from "./types";

// SWAPPABLE (ON HOLD, Kevin): both agree = that choice; disagree or missing = revote (the quicker one).
export function resolveTieChoice(a?: TieChoice, b?: TieChoice): TieChoice {
  return a && a === b ? a : "revote";
}

const rank = (h: string | null) => (h === "champion" ? 2 : h === "comeback" ? 1 : 0);

// SWAPPABLE: second tie after the replay. Higher hill at the start of the match wins (champion beats comeback);
// same hill, Act 1 (no hills yet), Last Chance and the Finale are random.
export function breakTie(m: Match, rng: Rng): string {
  const ra = rank(m.startHill.a), rb = rank(m.startHill.b);
  if (ra !== rb) return ra > rb ? m.a : m.b;
  return rng() < 0.5 ? m.a : m.b;
}
