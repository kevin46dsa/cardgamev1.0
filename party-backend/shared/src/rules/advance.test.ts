import { expect, test } from "vitest";
import { advance, mulberry32, nextDeadline } from "./index";
import { newGame, newSim, PROMPTS, adv } from "./testUtils";

const input = (s: { phaseId: number }, now: number) => ({ phaseId: s.phaseId, now, rng: mulberry32(1), promptIds: PROMPTS });

test("stale phaseId: same state object back with STALE_PHASE, never throws", () => {
  const sim = newGame(5);
  const r = advance(sim.s, { ...input(sim.s, 1e9), phaseId: sim.s.phaseId - 1 });
  expect(r.state).toBe(sim.s);
  expect(r.signal).toBe("STALE_PHASE");
  expect(r.events).toEqual([]);
  expect(advance(sim.s, { ...input(sim.s, 1e9), phaseId: 9999 }).signal).toBe("STALE_PHASE");
});

test("early call: unchanged state and TOO_EARLY", () => {
  const sim = newGame(5);
  const r = advance(sim.s, input(sim.s, sim.s.phaseEndsAt - 1));
  expect(r.state).toBe(sim.s);
  expect(r.signal).toBe("TOO_EARLY");
});

test("on time: moves one phase; the same call repeated is then stale (idempotent)", () => {
  const sim = newGame(5);
  const before = JSON.stringify(sim.s);
  const i = input(sim.s, sim.s.phaseEndsAt);
  const r = advance(sim.s, i);
  expect(JSON.stringify(sim.s)).toBe(before); // input not mutated
  expect(r.state.phase).toBe("write");
  expect(r.state.phaseId).toBe(sim.s.phaseId + 1);
  expect(r.events.map((e) => e.type)).toEqual(["phaseChanged"]);
  expect(advance(r.state, i).signal).toBe("STALE_PHASE");
});

test("very late call moves one phase only; the new deadline is measured from now", () => {
  const sim = newGame(5);
  const late = sim.s.phaseEndsAt + 10 * 60 * 1000;
  const r = advance(sim.s, input(sim.s, late));
  expect(r.state.phase).toBe("write");
  expect(r.state.phaseEndsAt).toBe(late + 45000);
});

test("deterministic: same seed, same inputs, same game", () => {
  const run = () => { const s = newGame(7, { rounds: 2 }, 11); for (let i = 0; i < 40; i++) adv(s); return JSON.stringify(s.s); };
  expect(run()).toBe(run());
});

test("lobby and final ignore advance", () => {
  const sim = newSim(4);
  expect(advance(sim.s, input(sim.s, 1e9)).signal).toBe("TOO_EARLY");
  expect(nextDeadline(sim.s)).toBeNull();
});

test("nextDeadline: phase end, or the earlier contestant grace", () => {
  const sim = newGame(5);
  expect(nextDeadline(sim.s)).toBe(sim.s.phaseEndsAt);
});
