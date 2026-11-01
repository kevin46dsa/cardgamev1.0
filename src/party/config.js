/** Shared constants for the "Funniest Answer" party client. No magic numbers live outside this file. */

const DEFAULT_WS_URL = "wss://gamenight-ws.nosenterprise.org";

/** WebSocket endpoint; override with VITE_WS_URL. */
export const WS_URL = import.meta.env?.VITE_WS_URL || DEFAULT_WS_URL;

const SECOND = 1000;

/** Reconnect delays in ms (api.md rule 3). The last value repeats. */
export const BACKOFF_MS = [1, 2, 4, 8, 16, 30].map((s) => s * SECOND);
/** After this long without a connection we stop retrying and offer "Try again". */
export const GIVE_UP_AFTER_MS = 2 * 60 * SECOND;
/** Idle screens ping this often so the room and socket stay alive. */
export const PING_INTERVAL_MS = 5 * 60 * SECOND;
/** Non-driver phones wait this long past a deadline before sending `advance`. */
export const ADVANCE_FALLBACK_MS = 3 * SECOND;
/** Safety margin so a slightly-off clock offset never sends `advance` before the server deadline (early calls are silently dropped). */
export const DEADLINE_MARGIN_MS = 250;
/** Countdown display refresh. Purely local, never touches the network. */
export const COUNTDOWN_REFRESH_MS = 250;

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;
export const MAX_NAME_LENGTH = 12;
export const MAX_ANSWER_LENGTH = 60;
export const ROOM_CODE_LENGTH = 4;
export const PAIR_CODE_LENGTH = 4;

export const WRITE_SECS_RANGE = { min: 10, max: 120, step: 5 };
export const VOTE_SECS_RANGE = { min: 5, max: 60, step: 5 };
export const ROUNDS_OPTIONS = [1, 2, 3];

export const STORAGE_KEYS = { phone: "party.session", tv: "party.tv" };

export const ROUTES = { phone: "/party", join: "/party/join", tv: "/party/tv" };

/** Connection states exposed to the UI. */
export const CONN = { IDLE: "idle", CONNECTING: "connecting", OPEN: "open", RECONNECTING: "reconnecting", FAILED: "failed" };

export const PHASE = {
  LOBBY: "lobby", INTRO: "intro", WRITE: "write", VOTE: "vote",
  TIEBREAK: "tiebreak", REVEAL: "reveal", TRANSITION: "transition", FINAL: "final",
};

/** Phases where nobody is waiting on a timer, so an idle ping is useful. */
export const IDLE_PHASES = [PHASE.LOBBY];

export const KIND_LABELS = {
  preliminary: "Preliminaries",
  hill: "Hill match",
  valley: "Valley of Shadow",
  fateDecider: "Fate decider",
  lastChance: "Last Chance",
  finale: "Finale",
};

export const SIDES = ["A", "B"];
export const CONTESTANT_ROLES = ["contestant", "fateDecider", "lastChance"];
