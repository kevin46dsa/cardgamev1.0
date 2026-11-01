import type { GameState, Role } from "./types";

// Role of a player on the current screen (see api.md "Screen-to-API mapping").
export function roleOf(s: GameState, id: string): Role {
  const m = s.match;
  if (m && (m.a === id || m.b === id) && ["intro", "write", "vote", "tiebreak", "reveal"].includes(s.phase))
    return m.fate === id ? "fateDecider" : m.kind === "lastChance" ? "lastChance" : "contestant";
  if (s.act === 1 && s.byes.includes(id)) return "bye";
  if (s.act === 2 && s.byes.includes(id)) return "sitsOut";
  if (s.act === 3 && (s.valley.champion.includes(id) || s.valley.comeback.includes(id))) return "valley";
  const r = s.finale?.rounds[s.finale.rounds.length - 1];
  if (s.act === 4 && s.finale?.stage === "bracket" && r?.byes.includes(id)) return "bye";
  return "crowd";
}
