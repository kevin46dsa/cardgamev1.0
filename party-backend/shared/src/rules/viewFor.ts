import { estimateMinutes } from "./estimateMinutes";
import { rosters } from "./hillsEvent";
import { roleOf } from "./roleOf";
import { GRACE_MS, type Finale, type GameState, type Hill, type MatchKind, type Outcome, type Role, type Settings, type Side, type TieChoice } from "./types";
import { find } from "./util";

export interface View {
  code: string;
  mode: string;
  hostId: string;
  settings: Settings;
  estimatedMinutes: number;
  phase: GameState["phase"];
  phaseId: number;
  endsAt: number;
  pausedUntil?: number;
  act: number;
  round: number;
  rounds: number;
  players: { id: string; name: string; hill: Hill | null; online: boolean; host: boolean; offlineSince?: number; graceEndsAt?: number }[];
  hills: { champion: string[]; comeback: string[]; valley: { champion: string[]; comeback: string[] }; sitsOut: string[] };
  finale?: Finale;
  king?: string;
  you?: { id: string; role: Role; status: "playing" | "returning" | "watching" | "late"; forfeited: boolean; hill: Hill | null; isHost: boolean };
  match?: {
    n: number;
    kind: MatchKind;
    promptId: string;
    contestants: string[]; // sorted by id: carries no information about sides
    stakes: Record<string, boolean>; // false only for a fate decider
    replay: number;
    sides?: { A: string; B: string }; // vote, tiebreak, reveal
    votes?: { A: number; B: number }; // tiebreak, reveal
    chosen?: string[]; // tiebreak: who has chosen (never what)
    yourChoice?: TieChoice;
    yourAnswer?: string; // write phase, contestants only
    yourVote?: Side;
    authors?: { A: string; B: string }; // reveal only
    result?: Pick<Outcome, "outcome" | "reason" | "winner" | "loser">; // reveal only
  };
}

export interface ViewCtx { ownAnswer?: string; myVote?: Side }

// Role-specific JSON snapshot. who = player id or 'tv'. Secrets: no answer text before the vote phase, authors
// only in the reveal phase, a contestant's own answer only to that contestant.
export function viewFor(s: GameState, who: string, ctx: ViewCtx = {}): View {
  const me = who === "tv" ? undefined : find(s, who);
  const m = s.match;
  const v: View = {
    code: s.code, mode: s.mode, hostId: s.hostId, settings: s.settings,
    estimatedMinutes: estimateMinutes(Math.max(3, s.players.filter((p) => !p.kicked && !p.left).length), s.settings.rounds, s.settings),
    phase: s.phase, phaseId: s.phaseId, endsAt: s.phaseEndsAt, act: s.act, round: s.round, rounds: s.settings.rounds,
    players: s.players.filter((p) => !p.kicked).map((p) => ({
      id: p.id, name: p.name, hill: p.hill, online: p.online && !p.left, host: p.id === s.hostId,
      ...(p.offlineSince !== undefined && !p.online ? { offlineSince: p.offlineSince, graceEndsAt: p.offlineSince + GRACE_MS } : {}),
    })),
    hills: { ...rosters(s), valley: s.valley, sitsOut: s.act === 2 ? s.byes : [] },
    finale: s.finale, king: s.king,
  };
  if (s.pausedUntil !== undefined) v.pausedUntil = s.pausedUntil;
  if (me) {
    const status = me.pending ? (s.act >= 4 ? "watching" : me.hill ? "returning" : "late") : "playing";
    v.you = { id: me.id, role: roleOf(s, me.id), status, forfeited: !!me.forfeited, hill: me.hill, isHost: me.id === s.hostId };
  }
  if (m && ["intro", "write", "vote", "tiebreak", "reveal"].includes(s.phase)) {
    const mine = me && (m.a === me.id || m.b === me.id);
    const showSides = s.phase === "vote" || s.phase === "tiebreak" || s.phase === "reveal";
    const showVotes = s.phase === "tiebreak" || s.phase === "reveal";
    v.match = {
      n: m.n, kind: m.kind, promptId: m.promptId, contestants: [m.a, m.b].sort(),
      stakes: { [m.a]: m.fate !== m.a, [m.b]: m.fate !== m.b }, replay: m.rp + m.vt,
    };
    if (showSides && m.texts) v.match.sides = m.texts;
    if (showVotes && m.out?.votes) v.match.votes = m.out.votes;
    if (s.phase === "tiebreak") {
      v.match.chosen = Object.keys(m.choices ?? {});
      const mc = me && m.choices?.[me.id];
      if (mc) v.match.yourChoice = mc;
    }
    if (s.phase === "write" && mine && ctx.ownAnswer) v.match.yourAnswer = ctx.ownAnswer;
    if (s.phase === "vote" && me && !mine && ctx.myVote) v.match.yourVote = ctx.myVote;
    if (s.phase === "reveal" && m.out) {
      const { outcome, reason, winner, loser } = m.out;
      v.match.result = { outcome, reason, winner, loser };
      if (m.texts) v.match.authors = m.flip ? { A: m.b, B: m.a } : { A: m.a, B: m.b };
    }
  }
  return v;
}
