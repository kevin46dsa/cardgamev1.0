# WebSocket API plan (contract for the backend and for the frontend agent)

**Implemented and deployed** (2026-10-31). The source of truth is `shared/src/protocol.ts` (types) and `ws-handler/README.md` (flows and a worked transcript); this file is the human summary. One socket per client:
`wss://gamenight-ws.nosenterprise.org`. All messages are JSON text frames under 2 KB.
Client sends `{ "action": "<name>", ... }`. Server replies/pushes `{ "event": "<name>", "serverNow": <ms>, ... }`.
Any rejected action gets `{ "event": "error", "code": "<CODE>", "message": "..." }` with a code from the table at the end.

## Frontend rules that keep cost down (please follow)

1. Never poll. Never send ticks. Render countdowns locally from `endsAt` (use `serverNow` to correct clock offset).
2. There is no typing signal. Crowd phones show a static "waiting" state until a `submitted` event arrives. Never send text before `submitAnswer`.
3. Reconnect with backoff 1,2,4,8,16,30s. Pause retries while `document.hidden`; retry on `visibilitychange`.
   After 2 minutes show "Try again" instead of retrying forever.
4. On (re)connect send exactly one `rejoin`. It returns a full `snapshot`; do not send anything else first.
5. Ping every 5 minutes only on screens that can sit idle (lobby, paused, TV pairing). Gameplay screens do not ping.
6. Store `{roomCode, playerId, token}` in localStorage (survives tab restore). Token is a secret.
7. Set one timer for each `endsAt` and send `advance {phaseId}` when it fires (TV/host at +0s, other clients at +3s
   and only if no newer `phaseId` arrived). Treat a `STALE_PHASE` error as success.

## Data model (single table `PartyGames`, `pk` + `sk`, `ttl`, no GSI)

Chosen split: hot concurrent writes are one item per player, so ten phones never fight over one record.

| Item | pk | sk | Key fields |
|---|---|---|---|
| Room (structure) | `ROOM#KQXM` | `META` | status, mode, settings, hostId, phase, phaseId, phaseEndsAt, match, act, round, hills {champion: [ids], comeback: [ids]}, bracket (current pairings, byes, finale tree), usedPromptIds, version, ttl |
| Player | `ROOM#KQXM` | `PLAYER#<id>` | name, tokenHash, connectionId, online, offlineSince, joinedAt, hill (champion/comeback, kept while away so a returner goes back to it), away (bool), kicked, userId? |
| TV | `ROOM#KQXM` | `TV` | connectionId, tvTokenHash |
| Answer | `ROOM#KQXM` | `ANSWER#<match>#<playerId>` | text, submittedAt |
| Vote | `ROOM#KQXM` | `VOTE#<match>#<voterId>` | side A or B |
| Connection lookup | `CONN#<connectionId>` | `CONN` | code, playerId (null = TV), ttl |
| Pairing | `PAIR#7429` | `PAIR` | tvConnectionId, roomCode?, ttl 10 min |
| Rate limit | `RATE#<ip or connId>` | `<window>` | count, ttl |

Structural changes (`startGame`, `advance`, join/leave, host change) update META with a `version` condition and retry
on conflict. These are low-frequency. A room is capped at 10 players, so META stays far below the 400 KB item limit.

## Client to server actions

| Action | Who | Payload | Effect / main errors |
|---|---|---|---|
| `ping` | any | none | `pong`. Exists today |
| `tvPair` | TV | none | Returns `pairCode` (4 digits, 10 min) and waits. Re-issue on expiry |
| `createRoom` | phone | name, mode `tv`/`phone`, pairCode (required for `tv`), settings | `roomCreated {roomCode, playerId, token}`; TV gets `paired`. `PAIR_INVALID`, `RATE_LIMITED` |
| `joinRoom` | phone | roomCode, name | `joined {playerId, token}` + `snapshot`. `ROOM_NOT_FOUND`, `ROOM_ENDED`, `ROOM_FULL`, `NAME_TAKEN`, `NAME_INVALID`, `NAME_BLOCKED`, `KICKED`, `FINALE_IN_PROGRESS` |
| `rejoin` | phone | roomCode, playerId, token | `snapshot` (welcome back). Works any time before the Finale for anyone who dropped or left (not for kicked players). Settles any overdue deadline first. `TOKEN_INVALID`, `ROOM_ENDED`, `KICKED` |
| `tvRejoin` | TV | roomCode, tvToken | `snapshot` for TV |
| `leaveRoom` | player | none | Removed from brackets (they may rejoin before the Finale); contestant forfeits; host auto-handed over |
| `updateSettings` | host | writeSecs, voteSecs, profanity, rounds (1 to 3, default 1), oddPlayerStart (champion/comeback) | Lobby only. `GAME_STARTED` |
| `startGame` | host or TV | none | Needs 3 players. `NOT_ENOUGH_PLAYERS`, `NOT_HOST` |
| `submitAnswer` | contestant | text | Replaces earlier answer until write ends. `NOT_CONTESTANT`, `ANSWER_EMPTY`, `ANSWER_TOO_LONG`, `ANSWER_BLOCKED`, `WRONG_PHASE` |

| `chooseTieBreak` | the two tied contestants | choice `reprompt`/`revote` | Only in the `tiebreak` phase (about 8s). `WRONG_PHASE`, `NOT_CONTESTANT` |
| `castVote` | crowd | side `A`/`B` | Replaces earlier vote until vote ends. `CONTESTANT_CANNOT_VOTE`, `WRONG_PHASE` |
| `advance` | any | phaseId | Moves to next phase if deadline passed. `TOO_EARLY`, `STALE_PHASE` (both harmless) |
| `kickPlayer` | host | playerId | Contestant forfeits. Kicked cannot rejoin |
| `makeHost` | host | playerId | Hands over host |
| `endGame` | host | none | Everyone back to lobby, brackets cleared |
| `playAgain` | host or TV | none | Brackets reset, same players, back to lobby |

Disconnect handling is not an action: `$disconnect` finds the player through the `CONN#<connectionId>` item (written when a socket binds to a player or the TV, deleted on disconnect), sets
`offlineSince` and the grace deadline, and notifies only TV, host and current opponent.

## Server to client events

Every event carries `serverNow` (ms). Compute `offset = serverNow - Date.now()` once; render all countdowns from absolute deadlines.

| Event | To | Payload |
|---|---|---|
| `pong` | caller | none |
| `pairCode` | TV | code, expiresAt |
| `paired` | TV | roomCode, tvToken (store it; used by `tvRejoin`) |
| `roomCreated` | creator | roomCode, playerId, token (store all three) |
| `joined` | joiner | playerId, token |
| `snapshot` | the (re)connecting client | view, nextDeadline. Full role-specific state |
| `state` | each recipient | view, nextDeadline, moves?. One per phase change, each recipient gets their own view |
| `reveal` | each recipient | same as `state`, sent when the new phase is reveal. Authors and per-side votes appear only here |
| `players` | TV, host, current opponent (all, in lobby) | players, hostId, nextDeadline |
| `settings` | all in lobby | settings, estimatedMinutes |
| `submitted` | TV + all phones | contestantId only (first submission only; no text) |
| `voteCount` | TV only, TV mode only | have, need. Never sent in phone-only mode |
| `voteAck` | the voter | side |
| `ack` | caller | action (for `chooseTieBreak`) |
| `hostChanged` | all | hostId, nextDeadline |
| `paused` / `resumed` | all | until / endsAt, nextDeadline |
| `tvStatus` | phones | connected |
| `kicked` | the kicked player | none |
| `left` | the leaver | none |
| `roomEnded` | all | reason `host` / `idle` |
| `error` | caller | code, message |

`view` shape: `{code, mode, hostId, settings, estimatedMinutes, phase, phaseId, endsAt, pausedUntil?, act, round, rounds,
players[], hills, finale?, king?, you, match?}`. `phase` is one of `lobby intro write vote tiebreak reveal transition final`.
`view.you` holds the viewer's `id, role (contestant|crowd|bye), status, forfeited, hill, isHost`. `view.match.prompt` is the
prompt text. After any `state`/`snapshot`/`reveal`/`players`/`hostChanged`/`paused`/`resumed`, arm ONE timer for `nextDeadline`
and send `advance {phaseId}` when it fires; `advance` for a stale or early phase is silently ignored (no reply).

Secrets are never sent early: answer text only from the vote phase on, authors only at `reveal`, and a contestant never
receives the opponent's answer before the vote.

## Typical flows (all verified end to end against the deployed socket)

- **Host (phone-only):** connect, `createRoom {name, mode:"phone"}`, store `roomCreated`, share `roomCode`, wait for joiners (`players`), `startGame`.
- **Host with TV:** TV connects and sends `tvPair` (shows `pairCode`); phone sends `createRoom {name, mode:"tv", pairCode}`; TV gets `paired`.
- **Player:** `joinRoom {roomCode, name}`, store `joined`.
- **Reconnect:** open socket, send exactly one `rejoin {roomCode, playerId, token}` (TV: `tvRejoin`), render the `snapshot`.
- **Gameplay:** render each `state`; contestants `submitAnswer`; the crowd `castVote`; tie contestants `chooseTieBreak`.

## Error codes

`ROOM_NOT_FOUND ROOM_ENDED ROOM_FULL NAME_TAKEN NAME_INVALID NAME_BLOCKED KICKED FINALE_IN_PROGRESS TOKEN_INVALID
NOT_HOST NOT_CONTESTANT CONTESTANT_CANNOT_VOTE NOT_ENOUGH_PLAYERS GAME_STARTED WRONG_PHASE ANSWER_EMPTY
ANSWER_TOO_LONG ANSWER_BLOCKED PAIR_INVALID RATE_LIMITED TOO_EARLY STALE_PHASE BAD_REQUEST`

These map one-to-one onto the error screens already in Figma rows A to F.

## Infrastructure changes this plan implies (small)

- Optional: drop the `$connect` Lambda route (nothing to do there; saves an invocation per connection).
- Lower stage throttle from 100/200 to about 30/60.
- Request the Lambda concurrency quota increase (account limit is 10).
- Add a `PartyGamesTable` TTL tombstone convention (ENDED META kept 24 hours).

## Screen-to-API mapping (pre-build review, 2026-10-31)

Every Figma screen needs these fields from the server. Added after cross-checking all frames against this plan.

- **Match kind** on every `phase`/`snapshot`: `preliminary | hill | valley | fateDecider | lastChance | finale`, plus
  `stakes: true/false` (false only for the fate decider's side, so the screen can say "playing for fun").
- **Player role** per recipient: `contestant | crowd | bye` (Act 1 odd player), `sitsOut` (odd player in a hill), `valley`,
  `fateDecider`, `lastChance`. Drives screens C3, C8, C9, C10, E1, E2.
- **Tie flow:** `reveal.outcome` can be `win | tie | identical | forfeit`. `tie` opens a `tiebreak` phase (about 8s) and
  the screens D6/D8 (phone) and G6 (TV). `identical` (Great minds, D5) skips the choice and goes straight to Reprompt.
  A tie that no one answers resolves to Revote.
- **Rejoin snapshot flags:** `status: returning` (welcome back, will rejoin `hill` at the next round), `forfeited: true`
  (F7), `kicked` handled by the `kicked` event.
- **Waiting banner (TV G5, phone F-row):** `players` roster entries carry `offlineSince` and `graceEndsAt`
  (15s contestant grace) so screens can show "12 seconds, then Maya wins by default" from a deadline.
- **Settings payload:** `writeSecs, voteSecs, profanity, rounds (1 to 3), oddPlayerStart`; the lobby also needs an
  `estimatedMinutes` hint (about 25 / 35 / 44 for 10 players at 1 / 2 / 3 rounds).
- **Live vote count** (`voteCount`) is sent only to the TV and only in TV mode (TV 3 shows "6 of 8 crowd votes in").
- **Finale bracket:** `hills` event includes the finale tree and the Last Chance pairing when it happens.
