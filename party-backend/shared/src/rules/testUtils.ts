// Test helpers only (not exported from index): drive the engine through its public API like a handler would.
import {
  addPlayer, advance, chooseTieBreak, createLobby, crowdIds, isActive, mulberry32, startGame, validateAnswer, validateVote,
  type EngineEvent, type GameState, type Ok, type Res, type Rng, type Settings, type Side,
} from "./index";

export const PROMPTS = Array.from({ length: 400 }, (_, i) => `p${i}`);
const WORDS = Array.from({ length: 30 }, (_, i) => `answer ${i}`);

export interface Sim { s: GameState; now: number; rng: Rng; events: EngineEvent[]; answers: Record<string, string>; votes: Record<string, Side>; calls: number }

export function ok(r: Res): Ok {
  if ("error" in r) throw new Error(`unexpected error ${r.error}`);
  return r;
}

export function newSim(n: number, settings: Partial<Settings> = {}, seed = 1, mode: "tv" | "phone" = "tv"): Sim {
  const rng = mulberry32(seed);
  let s = createLobby("ABCD", "p0", "P0", settings, mode, 1000);
  for (let i = 1; i < n; i++) s = ok(addPlayer(s, `p${i}`, `P${i}`, 1000 + i, rng)).state;
  return { s, now: 5000, rng, events: [], answers: {}, votes: {}, calls: 0 };
}

export function apply(sim: Sim, r: Res): Ok {
  const o = ok(r);
  sim.s = o.state;
  sim.events.push(...o.events);
  return o;
}

export function start(sim: Sim): void {
  apply(sim, startGame(sim.s, "p0", PROMPTS, sim.now, sim.rng));
  sim.answers = {};
  sim.votes = {};
}

// One advance call at `at` (default: the phase deadline). Clears per-match inputs when the keys change.
export function adv(sim: Sim, at?: number): Ok {
  sim.now = Math.max(sim.now, at ?? sim.s.phaseEndsAt);
  sim.calls++;
  const before = sim.s.match?.ak + "|" + sim.s.match?.vk;
  const r = advance(sim.s, { phaseId: sim.s.phaseId, now: sim.now, rng: sim.rng, promptIds: PROMPTS, answers: sim.answers, votes: sim.votes });
  sim.s = r.state;
  sim.events.push(...r.events);
  if (before !== sim.s.match?.ak + "|" + sim.s.match?.vk) {
    if (sim.s.match?.ak !== before.split("|")[0]) sim.answers = {};
    sim.votes = {};
  }
  return r;
}

export function submitAll(sim: Sim, text?: (id: string) => string): void {
  const m = sim.s.match!;
  for (const id of [m.a, m.b]) {
    const t = text ? text(id) : WORDS[Math.floor(sim.rng() * WORDS.length)]!;
    const v = validateAnswer(sim.s, id, t, sim.now);
    if ("error" in v) throw new Error(v.error);
    sim.answers[id] = v.text;
  }
}

export function voteAll(sim: Sim, pickSide?: (id: string) => Side): void {
  for (const id of crowdIds(sim.s)) {
    const side: Side = pickSide ? pickSide(id) : sim.rng() < 0.5 ? "A" : "B";
    const v = validateVote(sim.s, id, side, sim.now);
    if ("error" in v) throw new Error(v.error);
    sim.votes[id] = side;
  }
}

// Plays whatever the current phase needs and advances one phase. Mix of early ends and deadline ends.
export function playStep(sim: Sim): void {
  const s = sim.s;
  const m = s.match;
  if (s.phase === "write" && m) {
    submitAll(sim);
    adv(sim, sim.now + 1000);
  } else if (s.phase === "vote" && m) {
    voteAll(sim);
    adv(sim, sim.now + 500);
  } else if (s.phase === "tiebreak" && m) {
    for (const id of [m.a, m.b]) apply(sim, chooseTieBreak(sim.s, id, sim.rng() < 0.5 ? "reprompt" : "revote", sim.now));
    adv(sim, sim.now + 100);
  } else adv(sim);
}

export function playToEnd(sim: Sim, onStep?: (sim: Sim) => void, max = 3000): void {
  for (let i = 0; i < max && sim.s.phase !== "final"; i++) {
    playStep(sim);
    onStep?.(sim);
  }
}

export const activeCount = (s: GameState) => s.players.filter(isActive).length;

// Plays until pred(state) holds (checked before each step).
export function until(sim: Sim, pred: (s: GameState) => boolean, max = 2000): void {
  for (let i = 0; i < max && !pred(sim.s); i++) {
    if (sim.s.phase === "final") throw new Error("game ended before condition");
    playStep(sim);
  }
  if (!pred(sim.s)) throw new Error("condition never reached");
}

// Plays a match to its vote phase with distinct answers; the caller then votes.
export function toVote(sim: Sim): void {
  until(sim, (s) => s.phase === "write");
  submitAll(sim, (id) => `mine ${id}`);
  adv(sim, sim.now + 1000);
}

// Votes split evenly (needs an even crowd) -> tie.
export function tieVotes(sim: Sim): void {
  let i = 0;
  voteAll(sim, () => (i++ % 2 ? "A" : "B"));
}

export const reveals = (sim: Sim) => sim.events.filter((e): e is Extract<EngineEvent, { type: "reveal" }> => e.type === "reveal");
