import { expect, test } from "vitest";
import {
  addPlayer, GRACE_MS, markOffline, mulberry32, nextDeadline, rejoinPlayer, removePlayer, validateAnswer, validateVote, viewFor,
} from "./index";
import { adv, apply, newGame, ok, reveals, until, toVote } from "./testUtils";

const rng = mulberry32(9);

test("contestant offline past the grace forfeits; before it, nothing happens", () => {
  const sim = newGame(5, {}, 4);
  until(sim, (s) => s.phase === "write");
  const m = sim.s.match!;
  const T = sim.now;
  apply(sim, markOffline(sim.s, m.a, T, rng));
  expect(nextDeadline(sim.s)).toBe(T + GRACE_MS);
  expect(adv(sim, T + GRACE_MS - 1).signal).toBe("TOO_EARLY");
  expect(sim.s.phase).toBe("write");
  const r = adv(sim, T + GRACE_MS);
  expect(sim.s.phase).toBe("reveal");
  expect(r.events.some((e) => e.type === "playerForfeited" && e.playerId === m.a)).toBe(true);
  expect(reveals(sim).at(-1)).toMatchObject({ outcome: "forfeit", winner: m.b, loser: m.a });
  expect(viewFor(sim.s, m.a).you?.forfeited).toBe(true);
});

test("reconnecting inside the grace cancels the forfeit and keeps the player in the match", () => {
  const sim = newGame(5, {}, 4);
  until(sim, (s) => s.phase === "write");
  const m = sim.s.match!;
  apply(sim, markOffline(sim.s, m.a, sim.now, rng));
  apply(sim, rejoinPlayer(sim.s, m.a, sim.now + 5000, rng));
  expect(adv(sim, sim.now + 20000).signal).toBe("TOO_EARLY");
  expect(sim.s.phase).toBe("write");
  expect(sim.s.players.find((p) => p.id === m.a)!.pending).toBeUndefined();
});

test("forfeiter loses their Act 1 match: goes to the comeback hill", () => {
  const sim = newGame(6, {}, 4);
  until(sim, (s) => s.phase === "write");
  const m = sim.s.match!;
  apply(sim, removePlayer(sim.s, m.a, sim.now, rng));
  expect(sim.s.phase).toBe("reveal");
  until(sim, (s) => s.act === 2);
  expect(sim.s.players.find((p) => p.id === m.a)!.hill).toBe("comeback");
  expect(sim.s.players.find((p) => p.id === m.b)!.hill).toBe("champion");
});

test("a queued match whose contestant left forfeits when it starts", () => {
  const sim = newGame(6, {}, 4);
  const later = sim.s.queue[0]!;
  apply(sim, removePlayer(sim.s, later.a, sim.now, rng));
  until(sim, (s) => s.match?.n === 2);
  expect(sim.s.phase).toBe("reveal"); // forfeited the moment the match started, no intro
  expect(reveals(sim).at(-1)).toMatchObject({ outcome: "forfeit", winner: later.b });
  expect(sim.events.some((e) => e.type === "playerForfeited" && e.playerId === later.a)).toBe(true);
});

test("leave and rejoin: crowd until the next Act 2, then back in the stored hill", () => {
  const sim = newGame(9, { rounds: 2 }, 6);
  until(sim, (s) => s.act === 3 && s.phase === "intro");
  const s0 = sim.s;
  const target = s0.players.find((p) => p.hill && p.id !== s0.hostId && p.id !== s0.match!.a && p.id !== s0.match!.b && !s0.queue.some((m) => m.a === p.id || m.b === p.id) && !s0.valley.champion.includes(p.id) && !s0.valley.comeback.includes(p.id))!;
  const hill = target.hill;
  apply(sim, removePlayer(sim.s, target.id, sim.now, rng));
  expect(sim.s.players.find((p) => p.id === target.id)!.hill).toBe(hill); // hill is kept
  apply(sim, rejoinPlayer(sim.s, target.id, sim.now + 1000, rng));
  let v = viewFor(sim.s, target.id);
  expect(v.you?.status).toBe("returning");
  expect(v.you?.role).toBe("crowd");
  // can vote as crowd once a vote opens
  until(sim, (s) => s.phase === "write");
  toVote(sim);
  expect(validateVote(sim.s, target.id, "A", sim.now)).toMatchObject({ ok: true });
  until(sim, (s) => s.act === 2 && s.round === 2 && s.phase === "intro");
  const p = sim.s.players.find((x) => x.id === target.id)!;
  expect(p.pending).toBeUndefined();
  expect(p.hill).toBe(hill);
  const inBracket = sim.s.match!.a === p.id || sim.s.match!.b === p.id || sim.s.queue.some((m) => m.a === p.id || m.b === p.id) || sim.s.byes.includes(p.id);
  expect(inBracket).toBe(true);
  v = viewFor(sim.s, target.id);
  expect(v.you?.status).toBe("playing");
});

test("late join: crowd, no hill, enters the comeback hill at the next Act 2", () => {
  const sim = newGame(5, {}, 3);
  apply(sim, addPlayer(sim.s, "late", "Late", sim.now, rng));
  const late = () => sim.s.players.find((p) => p.id === "late")!;
  expect(late()).toMatchObject({ hill: null, pending: true });
  expect(viewFor(sim.s, "late").you).toMatchObject({ status: "late", role: "crowd" });
  until(sim, (s) => s.act === 2 && s.phase === "intro");
  expect(late().hill).toBe("comeback");
  expect(late().pending).toBeUndefined();
});

test("joining during the Finale is refused; a returner may still rejoin and watch", () => {
  const sim = newGame(6, {}, 3);
  until(sim, (s) => s.act === 4);
  expect(addPlayer(sim.s, "late", "Late", sim.now, rng)).toEqual({ error: "FINALE_IN_PROGRESS" });
  const r = ok(removePlayer(sim.s, "p5", sim.now, rng));
  const back = ok(rejoinPlayer(r.state, "p5", sim.now + 1, rng));
  expect(viewFor(back.state, "p5").you?.status).toBe("watching");
});

test("fewer than 3 connected pauses; 3 again resumes with the deadline pushed back", () => {
  const sim = newGame(4, {}, 3);
  until(sim, (s) => s.phase === "write");
  const T = sim.now, ends = sim.s.phaseEndsAt;
  const idle = ["p0", "p1", "p2", "p3"].filter((id) => id !== sim.s.match!.a && id !== sim.s.match!.b);
  const r = apply(sim, markOffline(sim.s, idle[0]!, T, rng));
  expect(r.events).toEqual([{ type: "players" }]); // 3 left: no pause
  const p = apply(sim, markOffline(sim.s, idle[1]!, T + 1000, rng));
  expect(p.events).toContainEqual({ type: "paused", until: T + 1000 + 60000 });
  expect(sim.s.pausedUntil).toBe(T + 61000);
  expect(validateAnswer(sim.s, sim.s.match!.a, "hi", T + 2000)).toEqual({ error: "WRONG_PHASE" });
  adv(sim, ends + 1); // deadline passes while paused: the phase does not move
  expect(sim.s.phase).toBe("write");
  expect(sim.s.phaseEndsAt).toBe(ends);
  const back = apply(sim, rejoinPlayer(sim.s, idle[1]!, T + 21000, rng));
  expect(back.events).toContainEqual({ type: "resumed", endsAt: ends + 20000 });
  expect(sim.s.pausedAt).toBeUndefined();
  expect(sim.s.players.find((x) => x.id === idle[0])!.offlineSince).toBe(T + 21000); // fresh grace
});

test("paused for 60s: back to the lobby keeping hills", () => {
  const sim = newGame(4, {}, 3);
  until(sim, (s) => s.act === 2);
  apply(sim, removePlayer(sim.s, "p2", sim.now, rng));
  apply(sim, removePlayer(sim.s, "p3", sim.now, rng));
  expect(sim.s.pausedAt).toBeDefined();
  const hills = sim.s.players.map((p) => p.hill);
  const r = adv(sim, sim.s.pausedUntil!);
  expect(r.events).toContainEqual({ type: "lobby", reason: "paused" });
  expect(sim.s.phase).toBe("lobby");
  expect(sim.s.players.map((p) => p.hill)).toEqual(hills);
  expect(sim.s.match).toBeUndefined();
});

test("everyone but one leaves: game pauses, then returns to the lobby (survivor is not crowned)", () => {
  const sim = newGame(4, {}, 3);
  for (const id of ["p1", "p2", "p3"]) apply(sim, removePlayer(sim.s, id, sim.now, rng));
  adv(sim, sim.s.pausedUntil!);
  expect(sim.s.phase).toBe("lobby");
  expect(sim.s.king).toBeUndefined();
});

