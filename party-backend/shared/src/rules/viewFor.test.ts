import { expect, test } from "vitest";
import { chooseTieBreak, estimateMinutes, expectedMatches, roleOf, viewFor } from "./index";
import { adv, apply, newGame, submitAll, tieVotes, toVote, until, voteAll } from "./testUtils";

const TEXT = (id: string) => `secret-${id}`;

test("write phase: nobody sees any answer text; a contestant sees only their own", () => {
  const sim = newGame(6, {}, 5);
  until(sim, (s) => s.phase === "write");
  const m = sim.s.match!;
  submitAll(sim, TEXT);
  const other = [...sim.s.players].find((p) => p.id !== m.a && p.id !== m.b)!.id;
  for (const who of ["tv", other, m.a, m.b]) {
    const v = viewFor(sim.s, who, { ownAnswer: who === m.a ? TEXT(m.a) : undefined });
    expect(v.match?.sides).toBeUndefined();
    expect(v.match?.authors).toBeUndefined();
    expect(JSON.stringify(v)).not.toContain(TEXT(m.b));
    if (who !== m.a) expect(JSON.stringify(v)).not.toContain(TEXT(m.a));
  }
  expect(viewFor(sim.s, m.a, { ownAnswer: "mine" }).match?.yourAnswer).toBe("mine");
  expect(viewFor(sim.s, other, { ownAnswer: "mine" }).match?.yourAnswer).toBeUndefined();
});

test("vote phase: A/B text for everyone, no authors, no flip; reveal adds authors and winner", () => {
  const sim = newGame(6, {}, 5);
  until(sim, (s) => s.phase === "write");
  const m = sim.s.match!;
  submitAll(sim, TEXT);
  adv(sim, sim.now + 1);
  expect(sim.s.phase).toBe("vote");
  const crowd = sim.s.players.find((p) => p.id !== m.a && p.id !== m.b)!.id;
  for (const who of ["tv", crowd, m.a]) {
    const v = viewFor(sim.s, who);
    expect(v.match?.sides && [v.match.sides.A, v.match.sides.B].sort()).toEqual([TEXT(m.a), TEXT(m.b)]);
    expect(v.match?.authors).toBeUndefined();
    expect(v.match?.result).toBeUndefined();
    expect(JSON.stringify(v)).not.toContain("flip");
    expect(v.match?.votes).toBeUndefined();
  }
  expect(viewFor(sim.s, crowd, { myVote: "B" }).match?.yourVote).toBe("B");
  expect(viewFor(sim.s, m.a, { myVote: "B" }).match?.yourVote).toBeUndefined();
  voteAll(sim, () => "A");
  adv(sim, sim.now + 1);
  const r = viewFor(sim.s, crowd);
  expect(sim.s.phase).toBe("reveal");
  expect(r.match?.authors).toBeDefined();
  expect(r.match?.result?.winner).toBe(r.match?.authors?.A);
  expect(r.match?.votes).toEqual({ A: 4, B: 0 });
});

test("tiebreak: sides and votes shown, still no authors; chosen lists who, never what (to the crowd)", () => {
  const sim = newGame(10, {}, 5);
  toVote(sim);
  tieVotes(sim);
  adv(sim, sim.now + 1);
  const m = sim.s.match!;
  apply(sim, chooseTieBreak(sim.s, m.a, "reprompt", sim.now));
  const crowd = sim.s.players.find((p) => p.id !== m.a && p.id !== m.b)!.id;
  const v = viewFor(sim.s, crowd);
  expect(v.phase).toBe("tiebreak");
  expect(v.match?.authors).toBeUndefined();
  expect(v.match?.votes).toEqual({ A: 4, B: 4 });
  expect(v.match?.chosen).toEqual([m.a]);
  expect(v.match?.yourChoice).toBeUndefined();
  expect(viewFor(sim.s, m.a).match?.yourChoice).toBe("reprompt");
  expect(viewFor(sim.s, m.b).match?.yourChoice).toBeUndefined();
});

test("roles, stakes, match kind, rosters, grace fields", () => {
  const sim = newGame(9, {}, 5);
  const byeId = sim.s.byes[0]!;
  expect(roleOf(sim.s, byeId)).toBe("bye");
  const m = sim.s.match!;
  expect(viewFor(sim.s, m.a).you?.role).toBe("contestant");
  expect(viewFor(sim.s, "tv").you).toBeUndefined();
  expect(viewFor(sim.s, "tv").match).toMatchObject({ kind: "preliminary", stakes: { [m.a]: true, [m.b]: true } });
  until(sim, (s) => s.act === 2 && s.phase === "intro");
  const sitter = sim.s.byes[0];
  if (sitter) expect(viewFor(sim.s, sitter).you?.role).toBe("sitsOut");
  const v = viewFor(sim.s, "p0");
  expect(v.hills.champion.length + v.hills.comeback.length).toBe(9);
  expect(v.estimatedMinutes).toBeGreaterThan(0);
  expect(v.players).toHaveLength(9);
});

test("phase, phaseId, endsAt and settings are in every view", () => {
  const sim = newGame(5, { rounds: 2 }, 5);
  const v = viewFor(sim.s, "p1");
  expect(v).toMatchObject({ phase: "intro", phaseId: sim.s.phaseId, endsAt: sim.s.phaseEndsAt, rounds: 2, settings: { rounds: 2, writeSecs: 45 } });
});

test("estimateMinutes: about 25 / 35 / 44 minutes for 10 players at 1 / 2 / 3 rounds", () => {
  const set = { writeSecs: 45, voteSecs: 15, oddPlayerStart: "champion" as const };
  expect([1, 2, 3].map((r) => expectedMatches(10, r))).toEqual([17, 23, 29]);
  [25, 35, 44].forEach((want, i) => expect(Math.abs(estimateMinutes(10, i + 1, set) - want)).toBeLessThanOrEqual(1));
  expect(estimateMinutes(10, 3, { ...set, writeSecs: 30 })).toBeLessThan(estimateMinutes(10, 3, set));
  expect(estimateMinutes(3, 1, set)).toBeGreaterThan(0);
});
