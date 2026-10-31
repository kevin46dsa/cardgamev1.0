import { GRACE_MS, type GameState, type MatchKind, type Plan, type Player } from "./types";

export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
export const find = (s: GameState, id: string): Player | undefined => s.players.find((p) => p.id === id);
export const isActive = (p: Player): boolean => p.online && !p.left && !p.kicked;
export const activeIds = (s: GameState): string[] => s.players.filter(isActive).map((p) => p.id);
export const hillOf = (s: GameState, id: string) => find(s, id)?.hill ?? null;
export const inMatch = (s: GameState, id: string): boolean => !!s.match && (s.match.a === id || s.match.b === id);

// Gone for good (left/kicked) or offline past the contestant grace.
export const isAbsent = (p: Player | undefined, now: number): boolean =>
  !p || !!p.left || !!p.kicked || (!p.online && now - (p.offlineSince ?? now) >= GRACE_MS);

export function pairUp(ids: string[], kind: MatchKind): Plan[] {
  const out: Plan[] = [];
  for (let i = 0; i + 1 < ids.length; i += 2) out.push({ kind, a: ids[i] as string, b: ids[i + 1] as string });
  return out;
}

// Voters: everyone connected who is not in the current match.
export const crowdIds = (s: GameState): string[] => s.players.filter((p) => isActive(p) && !inMatch(s, p.id)).map((p) => p.id);
