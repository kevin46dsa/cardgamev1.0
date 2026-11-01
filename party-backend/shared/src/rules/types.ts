// Plain-JSON game state and the engine's input/output types. No functions live in state.
export type Rng = () => number;
export type Hill = "champion" | "comeback";
export type Side = "A" | "B";
export type Mode = "tv" | "phone";
export type TieChoice = "reprompt" | "revote";
export type Phase = "lobby" | "intro" | "write" | "vote" | "tiebreak" | "reveal" | "transition" | "final";
export type MatchKind = "preliminary" | "hill" | "valley" | "fateDecider" | "lastChance" | "finale";
export type Role = "contestant" | "crowd" | "bye" | "sitsOut" | "valley" | "fateDecider" | "lastChance";

export const ERROR_CODES = [
  "ROOM_NOT_FOUND", "ROOM_ENDED", "ROOM_FULL", "NAME_TAKEN", "NAME_INVALID", "NAME_BLOCKED", "KICKED",
  "FINALE_IN_PROGRESS", "TOKEN_INVALID", "NOT_HOST", "NOT_CONTESTANT", "CONTESTANT_CANNOT_VOTE",
  "NOT_ENOUGH_PLAYERS", "GAME_STARTED", "WRONG_PHASE", "ANSWER_EMPTY", "ANSWER_TOO_LONG", "ANSWER_BLOCKED",
  "PAIR_INVALID", "RATE_LIMITED", "TOO_EARLY", "STALE_PHASE", "BAD_REQUEST",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;
export const MAX_ANSWER = 60;
export const GRACE_MS = 15000; // contestant offline this long = forfeit
export const HOST_AWAY_MS = 30000; // host offline this long = handoff
export const PAUSE_MS = 60000; // paused this long = back to lobby
export const INTRO_MS = 5000;
/** phaseEndsAt value meaning "no timer": write and vote wait for everyone instead of a clock. */
export const NO_TIMER = 0;
export const TIEBREAK_MS = 8000;
export const REVEAL_MS = 8000;
export const TRANSITION_MS = 5000;

export interface Settings {
  writeSecs: number;
  voteSecs: number;
  profanity: boolean; // true = filter on (the handler does the filtering; the engine only stores it)
  rounds: number; // 1 to 3
  oddPlayerStart: Hill;
}

export interface Player {
  id: string;
  name: string;
  hill: Hill | null; // stored hill; survives leaving. null = never placed yet
  online: boolean;
  offlineSince?: number;
  connectedAt: number; // for "longest connected" host handoff
  left?: true; // tapped Leave: out of brackets, may rejoin before the Finale
  kicked?: true; // cannot rejoin
  pending?: true; // crowd until the next Act 2 (late joiner, returner, forfeiter)
  forfeited?: true; // lost their last match by forfeit (cleared at the next batch)
}

export interface Plan { kind: MatchKind; a: string; b: string; fate?: string } // fate = id of the fate decider (a or b)

export interface Outcome {
  outcome: "win" | "tie" | "identical" | "forfeit";
  reason: "votes" | "default" | "tiebreaker" | "forfeit" | "tie" | "identical" | "blank";
  winner?: string;
  loser?: string;
  votes?: { A: number; B: number };
}

export interface Match extends Plan {
  n: number; // match number, unique per game
  promptId: string;
  rp: number; // reprompts so far
  vt: number; // revotes since the last prompt
  ak: string; // answer storage key: `${n}.${rp}`
  vk: string; // vote storage key: `${n}.${rp}.${vt}`
  startHill: { a: Hill | null; b: Hill | null };
  flip?: boolean; // secret: true = contestant b is side A
  texts?: { A: string; B: string }; // answers by side, set when write ends
  choices?: Record<string, TieChoice>;
  after?: "reprompt"; // when the reveal ends, replay with a new prompt
  out?: Outcome;
}

export interface BatchResult { k: MatchKind; w: string; l: string; fate?: string }

export interface Finale {
  stage: "lastChance" | "bracket";
  alive: string[]; // finalists for the current / next round
  lc?: { a: string; b: string; winner?: string };
  rounds: { pairs: [string, string][]; byes: string[]; winners: string[] }[];
}

export interface GameState {
  code: string;
  mode: Mode;
  hostId: string;
  settings: Settings;
  players: Player[];
  phase: Phase;
  phaseId: number;
  phaseEndsAt: number; // 0 in lobby / final
  pausedAt?: number;
  pausedUntil?: number;
  act: 0 | 1 | 2 | 3 | 4; // 4 = Finale (incl. Last Chance)
  round: number;
  queue: Plan[];
  match?: Match;
  matchNo: number;
  results: BatchResult[];
  byes: string[]; // Act 1 bye / Act 2 sitters
  valley: { champion: string[]; comeback: string[] }; // ids; champion = champion-hill losers
  sat: string[];
  finale?: Finale;
  usedPromptIds: string[];
  king?: string;
}

export interface Move { id: string; from: Hill | null; to: Hill | null }

export type EngineEvent =
  | { type: "players" }
  | { type: "settings"; settings: Settings }
  | { type: "hostChanged"; hostId: string }
  | { type: "kicked"; playerId: string }
  | { type: "paused"; until: number }
  | { type: "resumed"; endsAt: number }
  | { type: "lobby"; reason: "paused" | "playAgain" }
  | { type: "phaseChanged"; phase: Phase; phaseId: number; endsAt: number }
  | { type: "matchStarted"; n: number; kind: MatchKind; a: string; b: string; fate?: string; promptId: string; replay?: "reprompt" | "revote" }
  | { type: "reveal"; outcome: Outcome["outcome"]; reason: Outcome["reason"]; winner?: string; loser?: string; votes?: { A: number; B: number }; texts?: { A: string; B: string }; authors?: { A: string; B: string } }
  | { type: "playerForfeited"; playerId: string; matchN: number }
  | { type: "hills"; champion: string[]; comeback: string[]; valley: { champion: string[]; comeback: string[] }; sitsOut: string[]; moves: Move[]; finale?: Finale }
  | { type: "gameEnded"; king: string };

export interface Ok { state: GameState; events: EngineEvent[]; signal?: "STALE_PHASE" | "TOO_EARLY"; earlyEnd?: boolean }
export interface Err { error: ErrorCode }
export type Res = Ok | Err;

export interface AdvanceInput {
  phaseId: number;
  now: number;
  rng: Rng;
  promptIds: string[];
  answers?: Record<string, string>; // current answer key, by contestant id
  votes?: Record<string, Side>; // current vote key, by voter id
}
