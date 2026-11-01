import path from "node:path";

/** Everything tunable lives here: no magic numbers in specs. */
export const ROUTES = { phone: "/party", tv: "/party/tv", join: (code: string) => `/party/join/${code}` };

export const SECOND = 1000;
/** Settings minimums (src/party/config.js WRITE_SECS_RANGE / VOTE_SECS_RANGE): the quickest games the UI allows. */
export const FAST = { writeSecs: 10, voteSecs: 5 };
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;
/** Backend: contestant grace before a forfeit (rules/types.ts GRACE_MS). */
export const GRACE_MS = 15 * SECOND;

export const TIMEOUT = {
  /** one websocket round trip through API Gateway + Lambda (cold start included) */
  net: 15 * SECOND,
  /** a single match end to end, generously */
  phase: 40 * SECOND,
  /** a whole game: 3 players ~1.5 min, 10 players ~5 min */
  game: (players: number) => (3 + players * 1.2) * 60 * SECOND,
};
export const POLL_MS = 250;

export const VIEWPORT = {
  tv: { width: 1280, height: 720 },
  phone: { width: 390, height: 844 },
};
export const VIDEO_SIZE = {
  tv: { width: 960, height: 540 },
  phone: { width: 260, height: 563 },
};

/** Text shown by the visually hidden PhaseAnnouncer (src/party/components/PhaseAnnouncer.jsx), keyed by phase. */
export const PHASE_TEXT = {
  lobby: "Lobby",
  intro: "Next match",
  write: "Time to write",
  vote: "Time to vote",
  tiebreak: "It's a tie",
  reveal: "Results",
  transition: "Standings",
  final: "Game over",
} as const;
export type Phase = keyof typeof PHASE_TEXT;
export const PHASE_BY_TEXT = Object.fromEntries(Object.entries(PHASE_TEXT).map(([k, v]) => [v, k])) as Record<string, Phase>;

/** User-facing copy asserted by the specs (src/party/state/errors.js and the notice screens). */
export const COPY = {
  ROOM_NOT_FOUND: /could not find that room/i,
  ROOM_ENDED: /game has ended/i,
  ROOM_FULL: /room is full/i,
  NAME_TAKEN: /already has that name/i,
  NAME_INVALID: /names need 1 to 12/i,
  NAME_BLOCKED: /not allowed/i,
  KICKED_TITLE: /you were removed/i,
  ENDED_TITLE: /game ended/i,
  LEFT_TITLE: /you left the game/i,
  PAIR_INVALID: /tv code is wrong or expired/i,
  PAUSED: /game paused/i,
  WELCOME_BACK: /welcome back/i,
  TV_ENDED: /this game has ended/i,
  TV_DISCONNECTED: /tv disconnected/i,
  VOTE_COUNT: /\d+ of \d+ votes in/i,
};

export const ARTIFACTS = {
  root: path.resolve(__dirname, "../../../e2e-artifacts"),
  get videos() { return path.join(this.root, "videos"); },
  get screens() { return path.join(this.root, "screens"); },
};
