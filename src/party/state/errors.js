/** Friendly copy for every backend error code (party-backend/docs/api.md). */
export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: "We could not find that room. Check the 4-letter code and try again.",
  ROOM_ENDED: "That game has ended. Ask the host to start a new room.",
  ROOM_FULL: "That room is full (10 players). Try another room.",
  NAME_TAKEN: "Someone already has that name. Pick another one.",
  NAME_INVALID: "Names need 1 to 12 characters.",
  NAME_BLOCKED: "That name is not allowed. Please pick a different one.",
  KICKED: "The host removed you from this room.",
  FINALE_IN_PROGRESS: "The finale is on right now. You can join the next game.",
  TOKEN_INVALID: "We could not restore your seat. Join again with the room code.",
  NOT_HOST: "Only the host can do that.",
  NOT_CONTESTANT: "Only the two players in this match can do that.",
  CONTESTANT_CANNOT_VOTE: "You are in this match, so you cannot vote on it.",
  NOT_ENOUGH_PLAYERS: "You need at least 3 players to start.",
  GAME_STARTED: "The game already started, so settings are locked.",
  WRONG_PHASE: "Too late for that, the round moved on.",
  ANSWER_EMPTY: "Write something!",
  ANSWER_TOO_LONG: "That answer is too long. Keep it to 60 characters.",
  ANSWER_BLOCKED: "Let's keep it clean. Try a different answer.",
  PAIR_INVALID: "That TV code is wrong or expired. Check the code on the TV.",
  RATE_LIMITED: "Slow down a little and try again in a moment.",
  BAD_REQUEST: "Something went wrong. Please try again.",
};

/** Codes the server never surfaces; clients treat them as success. */
export const SILENT_CODES = ["STALE_PHASE", "TOO_EARLY"];

/** Codes that mean our stored seat is no longer valid. */
export const SESSION_LOST_CODES = ["TOKEN_INVALID", "ROOM_NOT_FOUND", "ROOM_ENDED", "KICKED"];

const FALLBACK = "Something went wrong. Please try again.";

/** @param {string} code @returns {string} */
export const messageFor = (code) => ERROR_MESSAGES[code] ?? FALLBACK;
