import { pick } from "./rng";
import type { Player, Rng } from "./types";

// SWAPPABLE: choose the fate decider. Prefer someone who sat out Act 2 (played least), else random.
export function pickFateDecider(candidates: Player[], sitters: string[], rng: Rng): Player | undefined {
  const pref = candidates.filter((p) => sitters.includes(p.id));
  return pick(pref.length ? pref : candidates, rng);
}
