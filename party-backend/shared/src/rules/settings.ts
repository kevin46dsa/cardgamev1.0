import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = { writeSecs: 45, voteSecs: 15, profanity: true, rounds: 1, oddPlayerStart: "champion" };

const int = (v: unknown, lo: number, hi: number) => typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi;

// Returns the merged settings, or null if any provided field is invalid. Unknown keys are ignored.
export function mergeSettings(cur: Settings, patch: Partial<Settings>): Settings | null {
  const p = patch ?? {};
  if (p.writeSecs !== undefined && !int(p.writeSecs, 10, 120)) return null;
  if (p.voteSecs !== undefined && !int(p.voteSecs, 5, 60)) return null;
  if (p.rounds !== undefined && !int(p.rounds, 1, 3)) return null;
  if (p.oddPlayerStart !== undefined && p.oddPlayerStart !== "champion" && p.oddPlayerStart !== "comeback") return null;
  if (p.profanity !== undefined && typeof p.profanity !== "boolean") return null;
  return {
    writeSecs: p.writeSecs ?? cur.writeSecs, voteSecs: p.voteSecs ?? cur.voteSecs, profanity: p.profanity ?? cur.profanity,
    rounds: p.rounds ?? cur.rounds, oddPlayerStart: p.oddPlayerStart ?? cur.oddPlayerStart,
  };
}
