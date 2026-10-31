import { expect, test } from "vitest";
import { breakTie, chooseTieBreak, isVoteComplete, isWriteComplete, resolveTieChoice, validateAnswer, validateVote } from "./index";
import { adv, apply, newGame, reveals, submitAll, tieVotes, toVote, until, voteAll } from "./testUtils";

test("resolveTieChoice: agree = that choice, anything else = revote", () => {
  expect(resolveTieChoice("reprompt", "reprompt")).toBe("reprompt");
  expect(resolveTieChoice("revote", "revote")).toBe("revote");
  expect(resolveTieChoice("reprompt", "revote")).toBe("revote");
  expect(resolveTieChoice("reprompt", undefined)).toBe("revote");
  expect(resolveTieChoice(undefined, undefined)).toBe("revote");
});

test("more votes wins; winner is the author of the winning side", () => {
  const sim = newGame(6, {}, 2);
  toVote(sim);
  const m = sim.s.match!;
  voteAll(sim, () => "A");
  adv(sim, sim.now + 1);
  expect(sim.s.phase).toBe("reveal");
  const r = reveals(sim).at(-1)!;
  expect(r.reason).toBe("votes");
  expect(r.votes).toEqual({ A: 4, B: 0 });
  expect(r.winner).toBe(r.authors!.A);
  expect([m.a, m.b]).toContain(r.winner);
});

test("exactly one answer wins by default; no vote phase", () => {
  const sim = newGame(5, {}, 2);
  until(sim, (s) => s.phase === "write");
  const m = sim.s.match!;
  sim.answers[m.b] = "only me";
  adv(sim); // deadline
  expect(sim.s.phase).toBe("reveal");
  expect(reveals(sim).at(-1)).toMatchObject({ outcome: "win", reason: "default", winner: m.b });
});

test("both blank: forced reprompt (no tiebreak phase), new prompt, new answer key", () => {
  const sim = newGame(5, {}, 2);
  until(sim, (s) => s.phase === "write");
  const { promptId, ak } = sim.s.match!;
  adv(sim);
  expect(sim.s.phase).toBe("reveal");
  expect(reveals(sim).at(-1)).toMatchObject({ outcome: "tie", reason: "blank" });
  adv(sim);
  expect(sim.s.phase).toBe("write");
  expect(sim.s.match!.promptId).not.toBe(promptId);
  expect(sim.s.match!.ak).not.toBe(ak);
  expect(sim.s.match!.rp).toBe(1);
});

test("identical answers (case and whitespace insensitive): Great minds, forced reprompt", () => {
  const sim = newGame(5, {}, 2);
  until(sim, (s) => s.phase === "write");
  const m = sim.s.match!;
  sim.answers[m.a] = "Banana  Phone";
  sim.answers[m.b] = " banana phone ";
  adv(sim, sim.now + 1000); // early end: both submitted
  expect(sim.s.phase).toBe("reveal");
  expect(reveals(sim).at(-1)?.outcome).toBe("identical");
  adv(sim);
  expect(sim.s.phase).toBe("write");
});

function tiedMatch(seed = 3) {
  const sim = newGame(10, {}, seed);
  toVote(sim);
  tieVotes(sim);
  adv(sim, sim.now + 1);
  expect(sim.s.phase).toBe("tiebreak");
  return sim;
}

test("tie: tiebreak phase, both choose reprompt -> new prompt and write", () => {
  const sim = tiedMatch();
  const m = sim.s.match!;
  const first = apply(sim, chooseTieBreak(sim.s, m.a, "reprompt", sim.now));
  expect(first.earlyEnd).toBe(false);
  expect(apply(sim, chooseTieBreak(sim.s, m.b, "reprompt", sim.now)).earlyEnd).toBe(true);
  const old = sim.s.match!.promptId;
  adv(sim, sim.now + 10);
  expect(sim.s.phase).toBe("write");
  expect(sim.s.match!.promptId).not.toBe(old);
});

test("tie: both choose revote -> same answers, new vote key", () => {
  const sim = tiedMatch();
  const m = sim.s.match!;
  const { ak, vk } = m;
  const texts = m.texts;
  apply(sim, chooseTieBreak(sim.s, m.a, "revote", sim.now));
  apply(sim, chooseTieBreak(sim.s, m.b, "revote", sim.now));
  adv(sim, sim.now + 10);
  expect(sim.s.phase).toBe("vote");
  expect(sim.s.match!.ak).toBe(ak);
  expect(sim.s.match!.vk).not.toBe(vk);
  expect(sim.s.match!.texts).toEqual(texts);
});

test("tie: disagreement or missing choice at the deadline defaults to revote", () => {
  const a = tiedMatch();
  apply(a, chooseTieBreak(a.s, a.s.match!.a, "reprompt", a.now));
  apply(a, chooseTieBreak(a.s, a.s.match!.b, "revote", a.now));
  adv(a, a.now + 10);
  expect(a.s.phase).toBe("vote");
  const b = tiedMatch(4);
  apply(b, chooseTieBreak(b.s, b.s.match!.a, "reprompt", b.now));
  expect(adv(b, b.now + 10).signal).toBe("TOO_EARLY"); // one choice is not enough to end early
  adv(b); // deadline
  expect(b.s.phase).toBe("vote");
  const c = tiedMatch(5);
  adv(c);
  expect(c.s.phase).toBe("vote");
});

test("tiebreak choices: contestants only, tiebreak phase only", () => {
  const sim = tiedMatch();
  const other = sim.s.players.find((p) => p.id !== sim.s.match!.a && p.id !== sim.s.match!.b)!.id;
  expect(chooseTieBreak(sim.s, other, "revote", sim.now)).toEqual({ error: "NOT_CONTESTANT" });
  expect(chooseTieBreak(sim.s, sim.s.match!.a, "nope" as never, sim.now)).toEqual({ error: "BAD_REQUEST" });
  const v = newGame(5);
  until(v, (s) => s.phase === "write");
  expect(chooseTieBreak(v.s, v.s.match!.a, "revote", v.now)).toEqual({ error: "WRONG_PHASE" });
});

test("second tie after the replay is decided (no endless loop): Act 1 / same hill is random but always a winner", () => {
  for (let seed = 1; seed < 20; seed++) {
    const sim = tiedMatch(seed);
    const m = sim.s.match!;
    apply(sim, chooseTieBreak(sim.s, m.a, "revote", sim.now));
    apply(sim, chooseTieBreak(sim.s, m.b, "revote", sim.now));
    adv(sim, sim.now + 1);
    sim.votes = {};
    tieVotes(sim);
    adv(sim, sim.now + 1);
    expect(sim.s.phase).toBe("reveal");
    const r = reveals(sim).at(-1)!;
    expect(r).toMatchObject({ outcome: "win", reason: "tiebreaker" });
    expect([m.a, m.b]).toContain(r.winner);
  }
});

test("breakTie: higher hill wins, same hill random", () => {
  const m = { a: "x", b: "y", startHill: { a: "comeback", b: "champion" } } as never;
  for (let i = 0; i < 10; i++) expect(breakTie(m, () => i / 10)).toBe("y");
  const same = { a: "x", b: "y", startHill: { a: "champion", b: "champion" } } as never;
  expect(breakTie(same, () => 0.1)).toBe("x");
  expect(breakTie(same, () => 0.9)).toBe("y");
});

test("second tie in the Valley: the champion-hill player wins", () => {
  const sim = newGame(10, {}, 8);
  until(sim, (s) => s.act === 3 && s.phase === "intro" && s.match?.kind === "valley");
  const m = sim.s.match!;
  expect(m.startHill).toEqual({ a: "champion", b: "comeback" });
  toVote(sim);
  tieVotes(sim);
  adv(sim, sim.now + 1);
  apply(sim, chooseTieBreak(sim.s, m.a, "revote", sim.now));
  apply(sim, chooseTieBreak(sim.s, m.b, "revote", sim.now));
  adv(sim, sim.now + 1);
  sim.votes = {};
  tieVotes(sim);
  adv(sim, sim.now + 1);
  expect(reveals(sim).at(-1)).toMatchObject({ reason: "tiebreaker", winner: m.a });
});

test("validateAnswer / validateVote / completion hints", () => {
  const sim = newGame(5, {}, 2);
  until(sim, (s) => s.phase === "write");
  const m = sim.s.match!;
  const crowd = sim.s.players.find((p) => p.id !== m.a && p.id !== m.b)!.id;
  expect(validateAnswer(sim.s, crowd, "hi", sim.now)).toEqual({ error: "NOT_CONTESTANT" });
  expect(validateAnswer(sim.s, m.a, "   ", sim.now)).toEqual({ error: "ANSWER_EMPTY" });
  expect(validateAnswer(sim.s, m.a, "x".repeat(61), sim.now)).toEqual({ error: "ANSWER_TOO_LONG" });
  expect(validateAnswer(sim.s, m.a, "x".repeat(60), sim.now)).toMatchObject({ ok: true });
  expect(validateAnswer(sim.s, m.a, " hi ", sim.now)).toEqual({ ok: true, text: "hi", ak: m.ak });
  expect(validateAnswer(sim.s, m.a, "late", sim.s.phaseEndsAt + 1)).toEqual({ error: "WRONG_PHASE" });
  expect(validateVote(sim.s, crowd, "A", sim.now)).toEqual({ error: "WRONG_PHASE" });
  expect(isWriteComplete(sim.s, 1)).toBe(false);
  expect(isWriteComplete(sim.s, 2)).toBe(true);
  submitAll(sim);
  adv(sim, sim.now + 1);
  if (sim.s.phase !== "vote") return; // identical answers by chance
  expect(validateVote(sim.s, m.a, "A", sim.now)).toEqual({ error: "CONTESTANT_CANNOT_VOTE" });
  expect(validateVote(sim.s, crowd, "C", sim.now)).toEqual({ error: "BAD_REQUEST" });
  expect(validateVote(sim.s, crowd, "B", sim.now)).toEqual({ ok: true, vk: sim.s.match!.vk });
  expect(validateAnswer(sim.s, m.a, "hi", sim.now)).toEqual({ error: "WRONG_PHASE" });
  expect(isVoteComplete(sim.s, 2)).toBe(false);
  expect(isVoteComplete(sim.s, 3)).toBe(true);
});

test("vote phase ends early only when every active crowd member voted; late votes do not count", () => {
  const sim = newGame(5, {}, 2);
  toVote(sim);
  const crowd = sim.s.players.filter((p) => p.id !== sim.s.match!.a && p.id !== sim.s.match!.b).map((p) => p.id);
  sim.votes[crowd[0]!] = "A";
  sim.votes[crowd[1]!] = "A";
  expect(adv(sim, sim.now + 1).signal).toBe("TOO_EARLY");
  sim.votes[crowd[2]!] = "B";
  expect(adv(sim, sim.now + 1).signal).toBeUndefined();
  expect(sim.s.phase).toBe("reveal");
});
