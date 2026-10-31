import { pickByes } from "./pickByes";
import { shuffle } from "./rng";
import type { GameState, Hill, Rng } from "./types";
import { isActive, pairUp } from "./util";

// Act 2: pair inside each hill. Active players join their stored hill (never-placed = comeback); away players are
// pending (crowd) until the next Act 2. An odd hill has one neutral sitter.
export function planAct2(s: GameState, rng: Rng): void {
  for (const p of s.players) {
    if (isActive(p)) {
      delete p.pending;
      p.hill ??= "comeback";
    } else p.pending = true;
  }
  s.queue = [];
  s.byes = [];
  for (const h of ["champion", "comeback"] as Hill[]) {
    let ids = shuffle(s.players.filter((p) => isActive(p) && p.hill === h).map((p) => p.id), rng);
    if (ids.length % 2) {
      const r = pickByes(ids, 1, s.sat, rng);
      s.sat = r.sat;
      s.byes.push(...r.byes);
      ids = ids.filter((i) => !r.byes.includes(i));
    }
    s.queue.push(...pairUp(ids, "hill"));
  }
}
