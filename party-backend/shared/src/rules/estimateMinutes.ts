import type { Settings } from "./types";

// SWAPPABLE: lobby hint. Expected match count with balanced hills (10 players: 17 / 23 / 29 matches for 1 / 2 / 3
// rounds) times (write + vote + ~30s of intro, reveal, transitions and the odd tiebreak). ~26 / 35 / 44 minutes.
export function expectedMatches(players: number, rounds: number, oddStart: Settings["oddPlayerStart"] = "champion"): number {
  const a1 = Math.floor(players / 2);
  const c = a1 + (players % 2 && oddStart === "champion" ? 1 : 0);
  const m = players - c;
  const hill = Math.floor(c / 2) + Math.floor(m / 2) + Math.max(Math.floor(c / 2), Math.floor(m / 2));
  const lastChance = c > 1 && c % 2 && m >= 2 ? 1 : 0;
  return a1 + rounds * hill + lastChance + Math.max(0, c + lastChance - 1);
}

export function estimateMinutes(players: number, rounds: number, settings: Pick<Settings, "writeSecs" | "voteSecs" | "oddPlayerStart">): number {
  return Math.round((expectedMatches(players, rounds, settings.oddPlayerStart) * (settings.writeSecs + settings.voteSecs + 30)) / 60);
}
