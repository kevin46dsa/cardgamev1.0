import { CONN } from "../config";

/**
 * @param {object|null} session stored session restored from localStorage
 * @returns {object} fresh party state
 */
export function createInitialState(session = null) {
  return {
    conn: CONN.IDLE,
    session, // phone: {roomCode, playerId, token}; tv: {roomCode, tvToken}
    pairCode: null, // TV only: {code, expiresAt}
    view: null,
    nextDeadline: null,
    moves: [],
    submitted: [], // contestant ids that have an answer in
    voteCount: null, // {have, need}, TV in TV mode only
    myVote: null,
    tieAcked: false,
    tvConnected: null,
    welcomeBack: false,
    kicked: false,
    left: false,
    ended: null, // "host" | "idle"
    error: null, // {code, message}
  };
}
