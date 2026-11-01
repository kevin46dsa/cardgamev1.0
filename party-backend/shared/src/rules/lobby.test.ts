import { expect, test } from "vitest";
import {
  addPlayer, advance, backToLobby, markOffline, createLobby, DEFAULT_SETTINGS, kickPlayer, makeHost, mulberry32, rejoinPlayer, removePlayer, startGame, updateSettings,
} from "./index";
import { newSim, ok, PROMPTS, start } from "./testUtils";

const rng = mulberry32(1);

test("createLobby: defaults, host is first player, state is plain JSON", () => {
  const s = createLobby("KQXM", "h", " Host ", { rounds: 2 }, "tv", 10);
  expect(s.settings).toEqual({ ...DEFAULT_SETTINGS, rounds: 2 });
  expect(s.players).toHaveLength(1);
  expect(s.players[0]?.name).toBe("Host");
  expect(s.phase).toBe("lobby");
  expect(JSON.parse(JSON.stringify(s))).toEqual(s);
});

test("addPlayer: name rules, capacity, no mutation", () => {
  const s0 = newSim(3).s;
  expect(addPlayer(s0, "x", "p1", 1, rng)).toEqual({ error: "NAME_TAKEN" });
  expect(addPlayer(s0, "x", "  ", 1, rng)).toEqual({ error: "NAME_INVALID" });
  expect(addPlayer(s0, "x", "123456789abcd", 1, rng)).toEqual({ error: "NAME_INVALID" });
  const before = JSON.stringify(s0);
  const s1 = ok(addPlayer(s0, "x", "New", 1, rng)).state;
  expect(s1.players).toHaveLength(4);
  expect(JSON.stringify(s0)).toBe(before);
  const full = newSim(10).s;
  expect(addPlayer(full, "x", "Extra", 1, rng)).toEqual({ error: "ROOM_FULL" });
});

test("updateSettings: host only, lobby only, validated", () => {
  const s = newSim(3).s;
  expect(updateSettings(s, "p1", { rounds: 2 })).toEqual({ error: "NOT_HOST" });
  expect(updateSettings(s, "p0", { rounds: 4 })).toEqual({ error: "BAD_REQUEST" });
  expect(updateSettings(s, "p0", { oddPlayerStart: "x" as never })).toEqual({ error: "BAD_REQUEST" });
  expect(ok(updateSettings(s, "p0", { rounds: 3, oddPlayerStart: "comeback" })).state.settings).toMatchObject({ rounds: 3, oddPlayerStart: "comeback", writeSecs: 45 });
  const sim = newSim(3);
  start(sim);
  expect(updateSettings(sim.s, "p0", { rounds: 2 })).toEqual({ error: "GAME_STARTED" });
});

test("startGame: needs host/tv, 3 active players, lobby", () => {
  const sim = newSim(3);
  expect(startGame(sim.s, "p1", PROMPTS, 1, rng)).toEqual({ error: "NOT_HOST" });
  const two = newSim(2).s;
  expect(startGame(two, "p0", PROMPTS, 1, rng)).toEqual({ error: "NOT_ENOUGH_PLAYERS" });
  const off = ok(removePlayer(sim.s, "p2", 1, rng)).state;
  expect(startGame(off, "p0", PROMPTS, 1, rng)).toEqual({ error: "NOT_ENOUGH_PLAYERS" });
  const started = ok(startGame(sim.s, "tv", PROMPTS, 1, rng));
  expect(started.state.phase).toBe("intro");
  expect(started.state.match?.kind).toBe("preliminary");
  expect(startGame(started.state, "p0", PROMPTS, 1, rng)).toEqual({ error: "GAME_STARTED" });
});

test("kick: host only; kicked player cannot rejoin; contestant forfeits", () => {
  const sim = newSim(4);
  start(sim);
  const m = sim.s.match!;
  expect(kickPlayer(sim.s, "p1", "p2", 1, rng)).toEqual({ error: "NOT_HOST" });
  const victim = m.a === "p0" ? m.b : m.a;
  const r = ok(kickPlayer(sim.s, "p0", victim, sim.now, rng));
  expect(r.state.phase).toBe("reveal");
  expect(r.events.some((e) => e.type === "playerForfeited" && e.playerId === victim)).toBe(true);
  expect(r.state.match?.out?.outcome).toBe("forfeit");
  expect(rejoinPlayer(r.state, victim, sim.now, rng)).toEqual({ error: "KICKED" });
});

test("host handoff: leave is immediate, offline waits 30s, longest-connected wins", () => {
  const sim = newSim(4);
  const left = ok(removePlayer(sim.s, "p0", 9000, rng));
  expect(left.state.hostId).toBe("p1"); // p1 joined first after the host
  expect(left.events).toContainEqual({ type: "hostChanged", hostId: "p1" });
  const sim2 = newSim(4);
  start(sim2);
  const off = ok(markOffline(sim2.s, "p0", 10000, rng));
  expect(off.state.hostId).toBe("p0");
  const later = ok(advance(off.state, { phaseId: off.state.phaseId, now: 40000, rng, promptIds: PROMPTS }));
  expect(later.state.hostId).toBe("p1");
  expect(makeHost(later.state, "p0", "p2")).toEqual({ error: "NOT_HOST" });
  expect(ok(makeHost(later.state, "p1", "p2")).state.hostId).toBe("p2");
  expect(makeHost(later.state, "p1", "p0")).toEqual({ error: "BAD_REQUEST" }); // p0 is offline
});

test("backToLobby: clears the game, keeps players, drops those who left", () => {
  const sim = newSim(5);
  start(sim);
  const s1 = ok(removePlayer(sim.s, "p4", sim.now, rng)).state;
  expect(backToLobby(s1, "p2")).toEqual({ error: "NOT_HOST" });
  const s2 = ok(backToLobby(s1, "p0")).state;
  expect(s2.phase).toBe("lobby");
  expect(s2.players.map((p) => p.id)).toEqual(["p0", "p1", "p2", "p3"]);
  expect(s2.players.every((p) => p.hill === null)).toBe(true);
  expect(s2.match).toBeUndefined();
});
