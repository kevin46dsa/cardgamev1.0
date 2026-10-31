import { messageFor, SESSION_LOST_CODES, SILENT_CODES } from "./errors";
import { createInitialState } from "./initialState";

/** Action creators for the reducer. */
export const partyActions = {
  server: (msg) => ({ type: "server", msg }),
  conn: (status) => ({ type: "conn", status }),
  dismissError: () => ({ type: "dismissError" }),
  dismissWelcome: () => ({ type: "dismissWelcome" }),
  pairExpired: () => ({ type: "pairExpired" }),
  reset: () => ({ type: "reset" }),
};

const withYouHost = (view, hostId) => ({
  ...view,
  hostId,
  you: view.you ? { ...view.you, isHost: view.you.id === hostId } : view.you,
});

/** Apply a room view and clear per-phase ephemera when the phase changed. */
function applyView(state, view, nextDeadline, extra = {}) {
  const phaseChanged = state.view?.phaseId !== view.phaseId;
  return {
    ...state,
    view,
    nextDeadline,
    error: null,
    submitted: phaseChanged ? [] : state.submitted,
    voteCount: phaseChanged ? null : state.voteCount,
    tieAcked: phaseChanged ? false : state.tieAcked,
    myVote: view.match?.yourVote ?? (phaseChanged ? null : state.myVote),
    ...extra,
  };
}

function onError(state, msg) {
  if (SILENT_CODES.includes(msg.code)) return state;
  const error = { code: msg.code, message: messageFor(msg.code) };
  const rejoining = state.session && !state.view;
  if (!rejoining || !SESSION_LOST_CODES.includes(msg.code)) return { ...state, error };
  const base = { ...state, session: null, pairCode: null };
  if (msg.code === "KICKED") return { ...base, kicked: true };
  if (msg.code === "ROOM_ENDED") return { ...base, ended: "host" };
  return { ...base, error };
}

function onServer(state, msg) {
  switch (msg.event) {
    case "pairCode":
      return { ...state, pairCode: { code: msg.code, expiresAt: msg.expiresAt } };
    case "paired":
      return { ...state, pairCode: null, session: { roomCode: msg.roomCode, tvToken: msg.tvToken } };
    case "roomCreated":
      return { ...state, session: { roomCode: msg.roomCode, playerId: msg.playerId, token: msg.token }, error: null };
    case "joined":
      return { ...state, session: { roomCode: null, playerId: msg.playerId, token: msg.token }, error: null };
    case "snapshot": {
      const session = state.session && !state.session.roomCode ? { ...state.session, roomCode: msg.view.code } : state.session;
      return applyView({ ...state, session }, msg.view, msg.nextDeadline, {
        welcomeBack: msg.view.you?.status === "returning" && !state.view,
        tvConnected: state.tvConnected ?? true,
      });
    }
    case "state":
    case "reveal":
      return applyView(state, msg.view, msg.nextDeadline, { moves: msg.moves ?? [] });
    case "players":
      if (!state.view) return state;
      return { ...state, nextDeadline: msg.nextDeadline, view: withYouHost({ ...state.view, players: msg.players }, msg.hostId) };
    case "settings":
      if (!state.view) return state;
      return { ...state, view: { ...state.view, settings: msg.settings, estimatedMinutes: msg.estimatedMinutes } };
    case "submitted":
      return state.submitted.includes(msg.contestantId) ? state : { ...state, submitted: [...state.submitted, msg.contestantId] };
    case "voteCount":
      return { ...state, voteCount: { have: msg.have, need: msg.need } };
    case "voteAck":
      return { ...state, myVote: msg.side };
    case "ack":
      return { ...state, tieAcked: true };
    case "hostChanged":
      if (!state.view) return state;
      return { ...state, nextDeadline: msg.nextDeadline, view: withYouHost(state.view, msg.hostId) };
    case "paused":
      if (!state.view) return state;
      return { ...state, nextDeadline: msg.nextDeadline, view: { ...state.view, pausedUntil: msg.until } };
    case "resumed": {
      if (!state.view) return state;
      const { pausedUntil, ...rest } = state.view;
      return { ...state, nextDeadline: msg.nextDeadline, view: { ...rest, endsAt: msg.endsAt } };
    }
    case "tvStatus":
      return { ...state, tvConnected: msg.connected };
    case "kicked":
      return { ...state, kicked: true, session: null, view: null, nextDeadline: null };
    case "left":
      return { ...state, left: true, session: null, view: null, nextDeadline: null };
    case "roomEnded":
      return { ...state, ended: msg.reason, session: null, view: null, nextDeadline: null, pairCode: null };
    case "error":
      return onError(state, msg);
    default:
      return state;
  }
}

/**
 * Pure reducer for everything the server tells us plus a few local UI actions.
 * @param {object} state see createInitialState
 * @param {{type: string, [k:string]: any}} action
 */
export function reducer(state, action) {
  switch (action.type) {
    case "server":
      return onServer(state, action.msg);
    case "conn":
      return { ...state, conn: action.status };
    case "dismissError":
      return { ...state, error: null };
    case "dismissWelcome":
      return { ...state, welcomeBack: false };
    case "pairExpired":
      return { ...state, pairCode: null };
    case "reset":
      return { ...createInitialState(null), conn: state.conn };
    default:
      return state;
  }
}
