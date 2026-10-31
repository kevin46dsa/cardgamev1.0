/**
 * Builders for every client -> server message (see party-backend/shared/src/protocol.ts).
 * @typedef {{action: string, [key: string]: any}} ClientMessage
 * @typedef {{writeSecs?: number, voteSecs?: number, profanity?: boolean, rounds?: number, oddPlayerStart?: "champion"|"comeback"}} Settings
 */

/** @returns {ClientMessage} */
export const ping = () => ({ action: "ping" });
/** @returns {ClientMessage} */
export const tvPair = () => ({ action: "tvPair" });
/**
 * @param {{name: string, pairCode?: string, settings?: Settings}} p mode is "tv" when a pairCode is given
 * @returns {ClientMessage}
 */
export const createRoom = ({ name, pairCode, settings }) => ({
  action: "createRoom",
  name,
  mode: pairCode ? "tv" : "phone",
  ...(pairCode ? { pairCode } : {}),
  ...(settings ? { settings } : {}),
});
/** @returns {ClientMessage} */
export const joinRoom = (roomCode, name) => ({ action: "joinRoom", roomCode, name });
/** @returns {ClientMessage} */
export const rejoin = ({ roomCode, playerId, token }) => ({ action: "rejoin", roomCode, playerId, token });
/** @returns {ClientMessage} */
export const tvRejoin = ({ roomCode, tvToken }) => ({ action: "tvRejoin", roomCode, tvToken });
/** @returns {ClientMessage} */
export const leaveRoom = () => ({ action: "leaveRoom" });
/** @param {Settings} patch @returns {ClientMessage} */
export const updateSettings = (patch) => ({ action: "updateSettings", ...patch });
/** @returns {ClientMessage} */
export const startGame = () => ({ action: "startGame" });
/** @returns {ClientMessage} */
export const kickPlayer = (playerId) => ({ action: "kickPlayer", playerId });
/** @returns {ClientMessage} */
export const makeHost = (playerId) => ({ action: "makeHost", playerId });
/** @returns {ClientMessage} */
export const endGame = () => ({ action: "endGame" });
/** @returns {ClientMessage} */
export const playAgain = () => ({ action: "playAgain" });
/** @returns {ClientMessage} */
export const submitAnswer = (text) => ({ action: "submitAnswer", text });
/** @param {"A"|"B"} side @returns {ClientMessage} */
export const castVote = (side) => ({ action: "castVote", side });
/** @param {"reprompt"|"revote"} choice @returns {ClientMessage} */
export const chooseTieBreak = (choice) => ({ action: "chooseTieBreak", choice });
/** @param {number} phaseId @returns {ClientMessage} */
export const advance = (phaseId) => ({ action: "advance", phaseId });
