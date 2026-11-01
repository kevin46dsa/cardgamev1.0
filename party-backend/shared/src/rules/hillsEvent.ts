import type { EngineEvent, GameState, Hill, Move } from "./types";

export const snapshotHills = (s: GameState): Record<string, Hill | null> => Object.fromEntries(s.players.map((p) => [p.id, p.hill]));

export const rosters = (s: GameState) => ({
  champion: s.players.filter((p) => p.hill === "champion").map((p) => p.id),
  comeback: s.players.filter((p) => p.hill === "comeback").map((p) => p.id),
});

// `hills` event: rosters, Valley, sitters, finale tree and who moved since `before`.
export function hillsEvent(s: GameState, before: Record<string, Hill | null>): EngineEvent {
  const moves: Move[] = s.players.filter((p) => before[p.id] !== p.hill).map((p) => ({ id: p.id, from: before[p.id] ?? null, to: p.hill }));
  return { type: "hills", ...rosters(s), valley: s.valley, sitsOut: s.act === 2 ? s.byes : [], moves, finale: s.finale };
}
