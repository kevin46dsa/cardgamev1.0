import { expect, test } from "vitest";
import {
  addPlayer, kickPlayer, markOffline, mulberry32, rejoinPlayer, removePlayer, startGame, viewFor, isActive, type GameState, type Res,
} from "./index";
import { adv, apply, newSim, playStep, PROMPTS, start, type Sim } from "./testUtils";

// Random drops, leaves, rejoins, kicks and late joins during whole games. Errors from invalid random requests are
// fine; engine exceptions, broken invariants, or a game that never ends are not.
const seen: Record<string, number> = {};
function chaosGame(seed: number): { kings: number; restarts: number; kicked: number } {
  const sim = newSim(4 + (seed % 7), { rounds: 1 + (seed % 3), oddPlayerStart: seed % 2 ? "champion" : "comeback" }, seed);
  const r = mulberry32(seed * 101 + 7);
  const roll = (p: number) => r() < p;
  const pickOf = (xs: string[]) => xs[Math.floor(r() * xs.length)];
  const tryOp = (res: Res) => { if (!("error" in res)) { sim.s = res.state; sim.events.push(...res.events); } };
  let restarts = 0, nextId = 100, kicked = 0;
  start(sim);
  const check = (s: GameState) => {
    const ids = s.players.map((p) => p.id);
    if (new Set(ids).size !== ids.length) throw new Error("duplicate player");
    for (const p of s.players) if (p.hill !== null && p.hill !== "champion" && p.hill !== "comeback") throw new Error("bad hill");
    const v = [...s.valley.champion, ...s.valley.comeback];
    if (new Set(v).size !== v.length || v.some((id) => !ids.includes(id))) throw new Error("valley broken");
    if (JSON.stringify(s).length > 20000) throw new Error("state too big");
    if (s.king && !ids.includes(s.king)) throw new Error("king not a player");
    if (!ids.includes(s.hostId)) throw new Error("host missing");
    for (const id of ids) viewFor(s, id);
  };
  for (let step = 0; step < 1500 && sim.s.phase !== "final"; step++) {
    const s = sim.s;
    const chaotic = step < 250;
    const ids = s.players.map((p) => p.id);
    const nonKicked = s.players.filter((p) => !p.kicked);
    if (chaotic && roll(0.25)) {
      const id = pickOf(ids)!;
      const op = r();
      if (op < 0.3) tryOp(markOffline(s, id, sim.now, r));
      else if (op < 0.45) tryOp(removePlayer(s, id, sim.now, r));
      else if (op < 0.8) tryOp(rejoinPlayer(s, id, sim.now, r));
      else if (op < 0.88 && nonKicked.length > 4 && id !== s.hostId) { tryOp(kickPlayer(s, s.hostId, id, sim.now, r)); kicked++; }
      else tryOp(addPlayer(s, `n${nextId++}`, `N${nextId}`, sim.now, r));
      sim.now += Math.floor(r() * 20000);
    }
    check(sim.s);
    if (sim.s.phase === "lobby") {
      // after a pause timeout: everyone who can comes back, then start again
      restarts++;
      for (const p of sim.s.players) if (!p.kicked) tryOp(rejoinPlayer(sim.s, p.id, sim.now, r));
      sim.answers = {};
      sim.votes = {};
      tryOp(startGame(sim.s, "tv", PROMPTS, sim.now, r));
      if (sim.s.phase === "lobby") throw new Error("could not restart");
    } else if (sim.s.pausedAt !== undefined) {
      const away = sim.s.players.filter((p) => !p.kicked && !isActive(p));
      if (!chaotic || roll(0.5)) for (const p of away) tryOp(rejoinPlayer(sim.s, p.id, sim.now, r));
      else adv(sim, sim.s.pausedUntil!);
    } else {
      if (!chaotic) for (const p of sim.s.players) if (!p.kicked && !isActive(p)) tryOp(rejoinPlayer(sim.s, p.id, sim.now, r));
      try { playStep(sim); } catch (e) { if (!/WRONG_PHASE/.test(String(e))) throw e; adv(sim); }
    }
  }
  expect(sim.s.phase).toBe("final");
  check(sim.s);
  for (const e of sim.events) seen[e.type] = (seen[e.type] ?? 0) + 1;
  for (const e of sim.events) if (e.type === "matchStarted" && e.fate) seen.fate = (seen.fate ?? 0) + 1;
  const kings = sim.events.filter((e) => e.type === "gameEnded").length;
  return { kings, restarts, kicked };
}

test("chaos: random drop / leave / rejoin / kick / late join still ends with exactly one king", () => {
  let restarts = 0, kicks = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const r = chaosGame(seed);
    expect(r.kings).toBe(1);
    restarts += r.restarts;
    kicks += r.kicked;
  }
  process.stderr.write(`CHAOS restarts ${restarts} kicks ${kicks} ${JSON.stringify(seen)}\n`);
  for (const k of ["playerForfeited", "hostChanged", "paused", "resumed", "lobby", "fate"]) expect(seen[k]).toBeGreaterThan(0);
}, 120000);
