import { expect, test } from "vitest";
import { viewFor, type Hill } from "./index";
import { newSim, playToEnd, start, type Sim } from "./testUtils";

const SEEDS = 200;

function game(n: number, rounds: number, odd: Hill, seed: number, checkViews: boolean) {
  const sim = newSim(n, { rounds, oddPlayerStart: odd }, seed * 7919 + n * 31 + rounds);
  start(sim);
  const ids = sim.s.players.map((p) => p.id);
  let byes: string[] = [];
  let maxSize = 0;
  const fdHill = new Map<number, string | null>();
  playToEnd(sim, (x: Sim) => {
    const s = x.s;
    if (s.act === 1 && !byes.length) byes = [...s.byes];
    maxSize = Math.max(maxSize, JSON.stringify(s).length);
    if (s.players.map((p) => p.id).join() !== ids.join()) throw new Error("players lost or duplicated");
    for (const p of s.players) if (p.hill !== null && p.hill !== "champion" && p.hill !== "comeback") throw new Error("bad hill");
    const v = [...s.valley.champion, ...s.valley.comeback];
    if (new Set(v).size !== v.length) throw new Error("valley duplicate");
    const q = s.queue.flatMap((m) => [m.a, m.b]);
    if (s.act !== 3 && new Set(q).size !== q.length) throw new Error("queue duplicate");
    const m = s.match;
    if (m?.fate) {
      const h = s.players.find((p) => p.id === m.fate)!.hill;
      if (!fdHill.has(m.n)) fdHill.set(m.n, h);
      if (h !== fdHill.get(m.n)) throw new Error("fate decider hill changed");
    }
    if (checkViews) for (const id of [...ids, "tv"]) viewFor(s, id);
  });
  expect(sim.s.phase).toBe("final");
  const started = sim.events.filter((e) => e.type === "matchStarted" && !e.replay) as Extract<(typeof sim.events)[number], { type: "matchStarted" }>[];
  expect(sim.events.filter((e) => e.type === "gameEnded")).toHaveLength(1);
  expect(ids).toContain(sim.s.king);
  // Act 1: everyone plays exactly once or has exactly the one bye
  const played = new Map<string, number>();
  for (const e of started.filter((e) => e.kind === "preliminary")) for (const id of [e.a, e.b]) played.set(id, (played.get(id) ?? 0) + 1);
  expect(byes).toHaveLength(n % 2);
  for (const id of ids) expect(played.get(id) ?? 0).toBe(byes.includes(id) ? 0 : 1);
  for (const e of started.filter((e) => e.kind === "fateDecider")) expect(e.fate === e.a || e.fate === e.b).toBe(true);
  expect(maxSize).toBeLessThan(20000);
  return { matches: started.length, calls: sim.calls, maxSize };
}

test("property: every player count x rounds x odd setting x many seeds plays a full game", () => {
  const t0 = Date.now();
  const avg: Record<string, number> = {};
  let maxCalls = 0, maxSize = 0;
  for (let n = 3; n <= 10; n++)
    for (let rounds = 1; rounds <= 3; rounds++) {
      let total = 0, games = 0;
      for (const odd of ["champion", "comeback"] as Hill[])
        for (let seed = 0; seed < SEEDS; seed++) {
          const r = game(n, rounds, odd, seed, seed % 20 === 0);
          total += r.matches; games++; maxCalls = Math.max(maxCalls, r.calls); maxSize = Math.max(maxSize, r.maxSize);
        }
      avg[`${n}p/${rounds}r`] = Math.round((total / games) * 100) / 100;
    }
  process.stderr.write(`SIM avg matches ${JSON.stringify(avg)} maxCalls ${maxCalls} maxSize ${maxSize} ms ${Date.now() - t0}\n`);
  expect(Math.abs((avg["10p/1r"] as number) - 17)).toBeLessThan(1.5);
  expect(Math.abs((avg["10p/2r"] as number) - 23)).toBeLessThan(1.5);
  expect(Math.abs((avg["10p/3r"] as number) - 29)).toBeLessThan(1.5);
}, 120000);
