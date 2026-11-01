import { shuffle } from "./rng";
import type { GameState, Rng } from "./types";
import { activeIds, pairUp } from "./util";

// Act 1: random pairs among active players; an odd player out gets a bye (placed by settings.oddPlayerStart at act end).
export function planAct1(s: GameState, rng: Rng): void {
  const ids = shuffle(activeIds(s), rng);
  s.byes = ids.length % 2 ? [ids.pop() as string] : [];
  s.queue = pairUp(ids, "preliminary");
}
