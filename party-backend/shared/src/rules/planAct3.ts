import { pickFateDecider } from "./pickFateDecider";
import type { GameState, Hill, Plan, Rng } from "./types";
import { find, isActive } from "./util";

// Act 3 Valley: champion-hill losers vs comeback-hill winners. Extras play a fate decider from the opposite hill
// (not in the Valley, not pending). With no fate decider left, the extra stays in their hill.
export function planAct3(s: GameState, rng: Rng): void {
  const sitters = s.byes; // Act 2 sitters
  s.byes = [];
  const live = (ids: string[]) => ids.filter((id) => { const p = find(s, id); return !!p && isActive(p); });
  const L = live(s.valley.champion), W = live(s.valley.comeback);
  s.valley = { champion: L, comeback: W };
  const n = Math.min(L.length, W.length);
  const q: Plan[] = L.slice(0, n).map((a, i) => ({ kind: "valley", a, b: W[i] as string }));
  const used = new Set<string>();
  const extras: [string[], Hill][] = [[L.slice(n), "comeback"], [W.slice(n), "champion"]];
  for (const [xs, opp] of extras) {
    for (const x of xs) {
      const pool = s.players.filter((p) => isActive(p) && !p.pending && p.hill === opp && !used.has(p.id) && !L.includes(p.id) && !W.includes(p.id));
      const fd = pickFateDecider(pool, sitters, rng);
      if (!fd) continue;
      used.add(fd.id);
      q.push({ kind: "fateDecider", a: x, b: fd.id, fate: fd.id });
    }
  }
  s.queue = q;
}
