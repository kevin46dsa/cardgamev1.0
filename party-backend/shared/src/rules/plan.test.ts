import { expect, test } from "vitest";
import { mulberry32, pickByes, removePlayer, type GameState, type Hill } from "./index";
import { pickFateDecider } from "./pickFateDecider";
import { planAct1 } from "./planAct1";
import { planAct2 } from "./planAct2";
import { planAct3 } from "./planAct3";
import { apply, newSim, until, start } from "./testUtils";

const rng = () => mulberry32(5);
const ids = (q: { a: string; b: string }[]) => q.flatMap((m) => [m.a, m.b]);

function withHills(n: number, champion: number): GameState {
  const s = newSim(n).s;
  s.players.forEach((p, i) => { p.hill = i < champion ? "champion" : "comeback"; });
  return s;
}

test("Act 1: even count pairs everyone once", () => {
  const s = newSim(10).s;
  planAct1(s, rng());
  expect(s.queue).toHaveLength(5);
  expect(s.byes).toEqual([]);
  expect(new Set(ids(s.queue)).size).toBe(10);
});

test("Act 1: odd count gives exactly one bye who is in no match", () => {
  const s = newSim(9).s;
  planAct1(s, rng());
  expect(s.queue).toHaveLength(4);
  expect(s.byes).toHaveLength(1);
  expect(ids(s.queue)).not.toContain(s.byes[0]);
});

test.each<Hill>(["champion", "comeback"])("odd player is placed in the %s hill after Act 1", (odd) => {
  const sim = newSim(9, { oddPlayerStart: odd });
  start(sim);
  const bye = sim.s.byes[0]!;
  until(sim, (s) => s.act === 2);
  expect(sim.s.players.find((p) => p.id === bye)!.hill).toBe(odd);
  const champs = sim.s.players.filter((p) => p.hill === "champion").length;
  expect(champs).toBe(odd === "champion" ? 5 : 4);
});

test("Act 1 winners go to champion, losers to comeback", () => {
  const sim = newSim(4);
  start(sim);
  until(sim, (s) => s.act === 2);
  const wins = sim.events.filter((e) => e.type === "reveal" && e.winner).map((e) => (e as { winner: string }).winner);
  for (const p of sim.s.players) expect(p.hill).toBe(wins.includes(p.id) ? "champion" : "comeback");
});

test("Act 2: pairs inside each hill, odd hill has one sitter, hills never mix", () => {
  const s = withHills(10, 5);
  planAct2(s, rng());
  expect(s.queue).toHaveLength(4);
  expect(s.byes).toHaveLength(2);
  for (const m of s.queue) expect(s.players.find((p) => p.id === m.a)!.hill).toBe(s.players.find((p) => p.id === m.b)!.hill);
  expect(new Set([...ids(s.queue), ...s.byes]).size).toBe(10);
});

test("Act 2: nobody sits out twice before everyone has (hill of 5, 5 rounds)", () => {
  const s = withHills(5, 5);
  const seen: string[] = [];
  for (let i = 0; i < 5; i++) {
    planAct2(s, mulberry32(i));
    seen.push(...s.byes);
  }
  expect(new Set(seen).size).toBe(5);
  planAct2(s, mulberry32(99)); // new cycle starts
  expect(seen).not.toContain(undefined);
});

test("Act 2: hill of one sits out, empty hill is skipped, never-placed players join comeback", () => {
  const s = withHills(3, 1);
  planAct2(s, rng());
  expect(s.queue).toHaveLength(1);
  expect(s.byes).toHaveLength(1);
  const t = withHills(4, 4);
  t.players[3]!.hill = null;
  planAct2(t, rng());
  expect(t.players[3]!.hill).toBe("comeback");
  const u = withHills(4, 4);
  planAct2(u, rng());
  expect(u.queue).toHaveLength(2); // comeback hill empty
});

test("pickByes: random, repeats only after a full cycle", () => {
  let sat: string[] = [];
  const got: string[] = [];
  for (let i = 0; i < 6; i++) { const r = pickByes(["a", "b", "c"], 1, sat, mulberry32(i)); sat = r.sat; got.push(...r.byes); }
  expect(new Set(got.slice(0, 3)).size).toBe(3);
  expect(new Set(got.slice(3)).size).toBe(3);
});

function valleyState(champLosers: number, compWinners: number, extraChamp: number, extraComeback: number): GameState {
  const total = champLosers + compWinners + extraChamp + extraComeback;
  const s = newSim(total).s;
  let i = 0;
  const take = (n: number, hill: Hill) => Array.from({ length: n }, () => { const p = s.players[i++]!; p.hill = hill; return p.id; });
  s.valley.champion = take(champLosers, "champion");
  s.valley.comeback = take(compWinners, "comeback");
  take(extraChamp, "champion");
  take(extraComeback, "comeback");
  return s;
}

test("Valley: champion losers face comeback winners", () => {
  const s = valleyState(2, 2, 3, 3);
  planAct3(s, rng());
  expect(s.queue.map((m) => m.kind)).toEqual(["valley", "valley"]);
});

test("Fate decider: uneven valley pulls from the opposite hill, never from the valley, prefers the Act 2 sitter", () => {
  const s = valleyState(3, 1, 2, 4);
  const comebackBench = s.players.filter((p) => p.hill === "comeback" && !s.valley.comeback.includes(p.id));
  s.byes = [comebackBench[2]!.id]; // sat out Act 2
  planAct3(s, rng());
  expect(s.queue.map((m) => m.kind)).toEqual(["valley", "fateDecider", "fateDecider"]);
  const fd = s.queue.filter((m) => m.fate).map((m) => m.fate!);
  expect(new Set(fd).size).toBe(2);
  expect(fd).toContain(comebackBench[2]!.id);
  for (const id of fd) expect(s.players.find((p) => p.id === id)!.hill).toBe("comeback");
  expect(s.valley.comeback).not.toContain(fd[0]);
});

test("Fate decider for a comeback winner comes from the champion hill", () => {
  const s = valleyState(0, 2, 2, 0);
  planAct3(s, rng());
  expect(s.queue).toHaveLength(2);
  for (const m of s.queue) expect(s.players.find((p) => p.id === m.fate)!.hill).toBe("champion");
});

test("Fate decider shortage: extras without a fate decider get no match and keep their hill", () => {
  const s = valleyState(0, 4, 1, 0); // 4 comeback winners, only 1 champion available
  planAct3(s, rng());
  expect(s.queue).toHaveLength(1);
  expect(s.queue[0]!.kind).toBe("fateDecider");
});

test("pickFateDecider: preference then random, none when empty", () => {
  const ps = [{ id: "a" }, { id: "b" }] as never[];
  expect(pickFateDecider(ps, ["b"], rng())?.id).toBe("b");
  expect(pickFateDecider([], [], rng())).toBeUndefined();
});

test("fate decider keeps their hill through the end of Act 3; the extra moves by the result (whole games)", () => {
  // Auto-play halves are always even (every match makes one winner + one loser), so a player leaving after Act 1 makes the Valley uneven.
  let fdMatches = 0;
  for (let seed = 1; seed < 40; seed++) {
    const sim = newSim(9, { rounds: 2 }, seed);
    start(sim);
    until(sim, (s) => s.act === 1 && s.queue.length === 0 && s.phase === "reveal");
    apply(sim, removePlayer(sim.s, sim.s.match!.out!.loser!, sim.now, sim.rng));
    const rec = new Map<string, Hill | null>();
    const hillOf = (s: GameState, id: string) => s.players.find((p) => p.id === id)!.hill;
    until(sim, (s) => {
      if (s.match?.fate && s.act === 3) rec.set(s.match.fate, rec.get(s.match.fate) ?? hillOf(s, s.match.fate));
      if (s.act !== 3 && rec.size) {
        for (const [id, h] of rec) expect(hillOf(s, id)).toBe(h);
        rec.clear();
      }
      return s.act === 4;
    });
    for (const e of sim.events) if (e.type === "matchStarted" && e.kind === "fateDecider" && !e.replay) fdMatches++;
  }
  expect(fdMatches).toBeGreaterThan(0);
});
