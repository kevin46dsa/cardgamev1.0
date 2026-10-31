import { shuffle } from "./rng";
import type { Rng } from "./types";

// SWAPPABLE: who sits out of an odd group. Random, but nobody twice before everyone has (`sat` = who already did).
export function pickByes(ids: string[], count: number, sat: string[], rng: Rng): { byes: string[]; sat: string[] } {
  let pool = ids.filter((i) => !sat.includes(i));
  let rest = sat;
  if (pool.length < count) {
    pool = ids;
    rest = sat.filter((i) => !ids.includes(i)); // everyone here has sat: start a new cycle
  }
  const byes = shuffle(pool, rng).slice(0, count);
  return { byes, sat: [...rest, ...byes] };
}
