import { pick } from "./rng";
import { breakTie, resolveTieChoice } from "./resolveTie";
import {
  type EngineEvent, type GameState, type Match, type Outcome, type Phase, type Rng, type Side,
  INTRO_MS, MAX_ANSWER, REVEAL_MS, TIEBREAK_MS,
} from "./types";
import { crowdIds, find, hillOf, isAbsent } from "./util";

export interface Ctx { now: number; rng: Rng; promptIds: string[] }

export function setPhase(s: GameState, phase: Phase, endsAt: number, events: EngineEvent[]): void {
  s.phase = phase;
  s.phaseId++;
  s.phaseEndsAt = endsAt;
  events.push({ type: "phaseChanged", phase, phaseId: s.phaseId, endsAt });
}

// Unused prompt, random. If the pool is exhausted the used list restarts.
export function pickPrompt(s: GameState, promptIds: string[], rng: Rng): string {
  let pool = promptIds.filter((id) => !s.usedPromptIds.includes(id));
  if (!pool.length) {
    s.usedPromptIds = [];
    pool = promptIds;
  }
  const id = pick(pool, rng) ?? "";
  s.usedPromptIds.push(id);
  return id;
}

const keys = (m: Match) => { m.ak = `${m.n}.${m.rp}`; m.vk = `${m.ak}.${m.vt}`; };
const norm = (t?: string) => (t ?? "").trim().slice(0, MAX_ANSWER);
const key = (t: string) => t.toLowerCase().replace(/\s+/g, " ");
const authorOf = (m: Match, side: Side) => ((side === "A") !== !!m.flip ? m.a : m.b);

export function startMatch(s: GameState, c: Ctx, events: EngineEvent[]): void {
  const plan = s.queue.shift();
  if (!plan) return;
  const n = ++s.matchNo;
  const m: Match = {
    ...plan, n, promptId: pickPrompt(s, c.promptIds, c.rng), rp: 0, vt: 0, ak: "", vk: "",
    startHill: { a: hillOf(s, plan.a), b: hillOf(s, plan.b) },
  };
  keys(m);
  s.match = m;
  events.push({ type: "matchStarted", n, kind: m.kind, a: m.a, b: m.b, fate: m.fate, promptId: m.promptId });
  setPhase(s, "intro", c.now + INTRO_MS, events);
}

export function replay(s: GameState, how: "reprompt" | "revote", c: Ctx, events: EngineEvent[]): void {
  const m = s.match as Match;
  delete m.out;
  delete m.choices;
  delete m.after;
  if (how === "reprompt") {
    m.rp++;
    m.vt = 0;
    m.promptId = pickPrompt(s, c.promptIds, c.rng);
    delete m.texts;
    delete m.flip;
  } else m.vt++;
  keys(m);
  events.push({ type: "matchStarted", n: m.n, kind: m.kind, a: m.a, b: m.b, fate: m.fate, promptId: m.promptId, replay: how });
  setPhase(s, how === "reprompt" ? "write" : "vote", c.now + (how === "reprompt" ? s.settings.writeSecs : s.settings.voteSecs) * 1000, events);
}

function payload(m: Match, withAuthors: boolean): EngineEvent {
  const o = m.out as Outcome;
  return {
    type: "reveal", outcome: o.outcome, reason: o.reason, winner: o.winner, loser: o.loser, votes: o.votes, texts: m.texts,
    authors: withAuthors && m.texts ? (m.flip ? { A: m.b, B: m.a } : { A: m.a, B: m.b }) : undefined,
  };
}

// Records a decided/void outcome and moves to the reveal phase.
function reveal(s: GameState, out: Outcome, c: Ctx, events: EngineEvent[]): void {
  const m = s.match as Match;
  if (out.winner) {
    out.loser = out.winner === m.a ? m.b : m.a;
    s.results.push({ k: m.kind, w: out.winner, l: out.loser, fate: m.fate });
  }
  m.out = out;
  events.push(payload(m, true));
  setPhase(s, "reveal", c.now + REVEAL_MS, events);
}

// A tie that cannot be replayed again (second tie), or one that is replayed: shared by write-end and vote-end.
function tie(s: GameState, out: Outcome, c: Ctx, events: EngineEvent[]): void {
  const m = s.match as Match;
  if (m.rp + m.vt >= 1) return reveal(s, { ...out, outcome: "win", reason: "tiebreaker", winner: breakTie(m, c.rng) }, c, events);
  if (out.outcome === "tie" && out.reason === "tie") {
    m.out = out;
    m.choices = {};
    events.push(payload(m, false));
    return setPhase(s, "tiebreak", c.now + TIEBREAK_MS, events);
  }
  m.after = "reprompt"; // identical / both blank: the choice is forced, skip tiebreak
  reveal(s, out, c, events);
}

export function resolveWrite(s: GameState, answers: Record<string, string>, c: Ctx, events: EngineEvent[]): void {
  const m = s.match as Match;
  const ta = norm(answers[m.a]), tb = norm(answers[m.b]);
  m.flip = false;
  m.texts = { A: ta, B: tb };
  if (!ta && !tb) return tie(s, { outcome: "tie", reason: "blank" }, c, events);
  if (!ta || !tb) return reveal(s, { outcome: "win", reason: "default", winner: ta ? m.a : m.b }, c, events);
  if (key(ta) === key(tb)) return tie(s, { outcome: "identical", reason: "identical" }, c, events);
  m.flip = c.rng() < 0.5;
  m.texts = m.flip ? { A: tb, B: ta } : { A: ta, B: tb };
  setPhase(s, "vote", c.now + s.settings.voteSecs * 1000, events);
}

export function resolveVote(s: GameState, votes: Record<string, Side>, c: Ctx, events: EngineEvent[]): void {
  const m = s.match as Match;
  const v = { A: 0, B: 0 };
  for (const [id, side] of Object.entries(votes)) {
    if (id === m.a || id === m.b || !find(s, id)) continue;
    if (side === "A" || side === "B") v[side]++;
  }
  if (v.A !== v.B) return reveal(s, { outcome: "win", reason: "votes", votes: v, winner: authorOf(m, v.A > v.B ? "A" : "B") }, c, events);
  tie(s, { outcome: "tie", reason: "tie", votes: v }, c, events);
}

export function endTiebreak(s: GameState, c: Ctx, events: EngineEvent[]): void {
  const m = s.match as Match;
  replay(s, resolveTieChoice(m.choices?.[m.a], m.choices?.[m.b]), c, events);
}

// A contestant who is gone (left/kicked) or offline past the grace forfeits; the opponent wins.
export function forfeitAbsent(s: GameState, c: Ctx, events: EngineEvent[]): void {
  const m = s.match;
  if (!m || s.pausedAt !== undefined || !["intro", "write", "vote", "tiebreak"].includes(s.phase)) return;
  const gone = [m.a, m.b].filter((id) => isAbsent(find(s, id), c.now));
  if (!gone.length) return;
  for (const id of gone) {
    const p = find(s, id);
    if (p) { p.forfeited = true; p.pending = true; }
    events.push({ type: "playerForfeited", playerId: id, matchN: m.n });
  }
  const winner = gone.length === 2 ? (c.rng() < 0.5 ? m.a : m.b) : gone[0] === m.a ? m.b : m.a;
  reveal(s, { outcome: "forfeit", reason: "forfeit", winner }, c, events);
}

// Early-end hints used by advance (answers/votes are supplied by the handler).
export function earlyEnd(s: GameState, answers?: Record<string, string>, votes?: Record<string, Side>): boolean {
  const m = s.match;
  if (!m) return false;
  if (s.phase === "write") return !!norm(answers?.[m.a]) && !!norm(answers?.[m.b]);
  if (s.phase === "vote") {
    const crowd = crowdIds(s);
    return crowd.length > 0 && crowd.every((id) => votes?.[id] === "A" || votes?.[id] === "B");
  }
  if (s.phase === "tiebreak") return !!m.choices?.[m.a] && !!m.choices?.[m.b];
  return false;
}
