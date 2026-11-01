import { expect, test } from "vitest";
import { mulberry32, type GameState } from "./index";
import { startFinale } from "./finale";
import { adv, newSim, until, type Sim } from "./testUtils";

// n champions + c comeback players, straight into the Finale.
// Padding players (min 3 so the game is not paused) have no hill and stay out of the Finale.
function finaleSim(n: number, c: number, seed = 1): Sim {
  const sim = newSim(Math.max(n + c, 3), {}, seed);
  sim.s.players.forEach((p, i) => { p.hill = i < n ? "champion" : i < n + c ? "comeback" : null; });
  sim.s.act = 3;
  sim.s.round = 1;
  sim.s.phase = "reveal";
  sim.s.phaseEndsAt = 1; // already due
  sim.s.match = { kind: "valley", a: "p0", b: "p1", n: 1, promptId: "x", rp: 0, vt: 0, ak: "1.0", vk: "1.0.0", startHill: { a: null, b: null } };
  return sim;
}

function playFinale(sim: Sim): { matches: number; kinds: string[] } {
  adv(sim); // reveal end -> planNext -> finale planned
  if (sim.s.phase === "final") return { matches: 0, kinds: [] };
  const before = sim.events.length;
  until(sim, (s) => s.phase === "final" || false, 500);
  const started = sim.events.slice(before - 1).filter((e) => e.type === "matchStarted" && !e.replay) as { kind: string }[];
  return { matches: started.length, kinds: started.map((e) => e.kind) };
}

const expected = (n: number, lastChance: boolean) => (n <= 1 ? 0 : lastChance && n % 2 ? n + 1 : n - 1);

test.each([1, 2, 3, 4, 5, 6, 7, 8])("single elimination with %i champions and plenty of comeback players", (n) => {
  const sim = finaleSim(n, Math.min(4, 10 - n));
  const r = playFinale(sim);
  expect(sim.s.king).toBeTruthy();
  expect(sim.s.players.find((p) => p.id === sim.s.king)).toBeTruthy();
  expect(r.matches).toBe(expected(n, true));
  expect(r.kinds.filter((k) => k === "lastChance")).toHaveLength(n > 1 && n % 2 ? 1 : 0);
  if (n > 1 && n % 2) expect(r.kinds[0]).toBe("lastChance");
});

test.each([1, 2, 3, 4, 5, 6, 7, 8])("with no comeback players: %i champions use byes, no Last Chance", (n) => {
  const sim = finaleSim(n, 0);
  const r = playFinale(sim);
  expect(sim.s.king).toBeTruthy();
  expect(r.matches).toBe(expected(n, false));
  expect(r.kinds).not.toContain("lastChance");
});

test("one champion is crowned without a match; with 1 comeback player the open spot is a bye", () => {
  const one = finaleSim(1, 5);
  adv(one);
  expect(one.s.phase).toBe("final");
  expect(one.s.king).toBe("p0");
  const odd = finaleSim(3, 1);
  const r = playFinale(odd);
  expect(r.kinds).not.toContain("lastChance");
  expect(r.matches).toBe(2);
});

test("Last Chance: two random comeback players, winner joins the bracket as a finalist; even count has none", () => {
  const sim = finaleSim(3, 5);
  adv(sim);
  expect(sim.s.finale?.stage).toBe("lastChance");
  const lc = sim.s.finale!.lc!;
  expect(sim.s.players.find((p) => p.id === lc.a)!.hill).toBe("comeback");
  expect(sim.s.players.find((p) => p.id === lc.b)!.hill).toBe("comeback");
  until(sim, (s) => s.finale?.stage === "bracket");
  expect(sim.s.finale!.alive).toHaveLength(4);
  expect(sim.s.finale!.alive).toContain(sim.s.finale!.lc!.winner);
  const even = finaleSim(4, 5);
  adv(even);
  expect(even.s.finale?.stage).toBe("bracket");
  expect(even.s.finale?.lc).toBeUndefined();
});

test("bracket byes: odd rounds use a bye and nobody sits out twice before everyone has", () => {
  const s = { sat: [] as string[], finale: undefined } as unknown as GameState;
  s.players = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, name: `p${i}`, hill: "champion", online: true, connectedAt: 0 })) as never;
  s.queue = [];
  startFinale(s, mulberry32(3)); // 5 champions, no comeback: bracket with one bye
  expect(s.finale!.rounds[0]!.byes).toHaveLength(1);
  expect(s.queue).toHaveLength(2);
});
