/**
 * WebSocket protocol for "Funniest Answer". One JSON text frame per message, client frames under 2 KB.
 * Client -> server: { action: "<name>", ...payload }.  Server -> client: { event: "<name>", serverNow, ... }.
 *
 * Frontend is plain JS, so this block is the contract (the types below are the same thing, for TypeScript):
 *
 * Every server message has `serverNow` (ms). Compute offset = serverNow - Date.now() once and render countdowns
 * from absolute deadlines. Messages that carry room state also have `nextDeadline` (ms or null): arm ONE timer
 * for it and send `advance {phaseId}` when it fires (phaseId = the last view.phaseId you hold).
 *
 * @typedef {{code:string, mode:"tv"|"phone", hostId:string, settings:object, estimatedMinutes:number,
 *   phase:"lobby"|"intro"|"write"|"vote"|"tiebreak"|"reveal"|"transition"|"final", phaseId:number, endsAt:number,
 *   pausedUntil?:number, act:number, round:number, rounds:number, players:object[], hills:object, finale?:object,
 *   king?:string, you?:object, match?:object}} View   view.match.prompt is the prompt TEXT (match.promptId its id)
 *
 * Client actions                         -> main replies (caller)               -> pushes to others
 *   ping                                 -> pong
 *   tvPair                               -> pairCode {code, expiresAt}
 *   createRoom {name, mode, pairCode?, settings?} -> roomCreated {roomCode, playerId, token} + snapshot
 *                                                                               TV: paired {roomCode, tvToken} + snapshot
 *   joinRoom {roomCode, name}            -> joined {playerId, token} + snapshot  TV+host: players (all in lobby)
 *   rejoin {roomCode, playerId, token}   -> snapshot                             TV+host+opponent: players
 *   tvRejoin {roomCode, tvToken}         -> snapshot                             phones: tvStatus
 *   leaveRoom                            -> left                                 TV+host(+lobby): players
 *   updateSettings {writeSecs?, voteSecs?, profanity?, rounds?, oddPlayerStart?} -> (settings to all in lobby)
 *   startGame | playAgain | endGame      -> state (own view)                     state (each own view) / roomEnded
 *   kickPlayer {playerId}                -> (players)                            kicked -> target
 *   makeHost {playerId}                  -> hostChanged                          hostChanged -> all
 *   submitAnswer {text}                  -> submitted {contestantId}             submitted -> TV + all phones
 *   castVote {side}                      -> voteAck {side}                       voteCount {have,need} -> TV only, TV mode
 *   chooseTieBreak {choice}              -> ack
 *   advance {phaseId}                    -> nothing (stale / too early are silent) state / reveal when the phase moved
 *
 * Phase changes are ONE message per recipient: `state` (or `reveal` when the new phase is reveal) = { view, nextDeadline,
 * moves? } where view is that recipient's own role-specific view. Authors only appear in `reveal`; answer text only from
 * the vote phase on. There is no typing event and no server tick.
 *
 * Errors: { event:"error", code, message, serverNow } with code from ERROR_CODES. STALE_PHASE/TOO_EARLY are never sent.
 */
import type { ErrorCode, Move, Settings, Side, TieChoice, View } from "./rules";

export type { ErrorCode, Move, Settings, Side, TieChoice, View };
export { ERROR_CODES } from "./rules/types";

export type WireView = Omit<View, "match"> & { match?: NonNullable<View["match"]> & { prompt: string } };
export type PlayerRow = View["players"][number];

export type ClientAction =
  | { action: "ping" }
  | { action: "tvPair" }
  | { action: "createRoom"; name: string; mode: "tv" | "phone"; pairCode?: string; settings?: Partial<Settings> }
  | { action: "joinRoom"; roomCode: string; name: string }
  | { action: "rejoin"; roomCode: string; playerId: string; token: string }
  | { action: "tvRejoin"; roomCode: string; tvToken: string }
  | { action: "leaveRoom" }
  | ({ action: "updateSettings" } & Partial<Settings>)
  | { action: "startGame" }
  | { action: "kickPlayer"; playerId: string }
  | { action: "makeHost"; playerId: string }
  | { action: "endGame" }
  | { action: "playAgain" }
  | { action: "submitAnswer"; text: string }
  | { action: "castVote"; side: Side }
  | { action: "chooseTieBreak"; choice: TieChoice }
  | { action: "advance"; phaseId: number };

/** What the handlers emit; `serverNow` is stamped on by the ctx sender. */
export type ServerEventBody =
  | { event: "pong" }
  | { event: "error"; code: ErrorCode; message: string }
  | { event: "pairCode"; code: string; expiresAt: number }
  | { event: "paired"; roomCode: string; tvToken: string }
  | { event: "roomCreated"; roomCode: string; playerId: string; token: string }
  | { event: "joined"; playerId: string; token: string }
  | { event: "snapshot"; view: WireView; nextDeadline: number | null }
  | { event: "state" | "reveal"; view: WireView; nextDeadline: number | null; moves?: Move[] }
  | { event: "players"; players: PlayerRow[]; hostId: string; nextDeadline: number | null }
  | { event: "settings"; settings: Settings; estimatedMinutes: number }
  | { event: "submitted"; contestantId: string }
  | { event: "voteCount"; have: number; need: number }
  | { event: "voteAck"; side: Side }
  | { event: "ack"; action: string }
  | { event: "hostChanged"; hostId: string; nextDeadline: number | null }
  | { event: "paused"; until: number; nextDeadline: number | null }
  | { event: "resumed"; endsAt: number; nextDeadline: number | null }
  | { event: "tvStatus"; connected: boolean }
  | { event: "kicked" }
  | { event: "left" }
  | { event: "roomEnded"; reason: "host" | "idle" };

export type ServerEvent = ServerEventBody & { serverNow: number };
