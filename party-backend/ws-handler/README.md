# ws-handler (WebSocket handlers for "Funniest Answer")

One Lambda behind an API Gateway WebSocket API. Contract for the frontend: `shared/src/protocol.ts` (top comment is the
JS-friendly version) and `docs/api.md`. Rules live in `shared/src/rules` (pure engine), storage in `shared/src/db`.

## How a request flows

`handler.ts` -> `$connect`: 200, nothing. `$disconnect`: `actions/disconnect.ts`. `$default`: `checkFrame` (2 KB, JSON) ->
`connectionRate` (10 msg/s) -> `dispatch` (an `Object.hasOwn` map of 17 actions) -> `actions/<name>.ts`. Any exception becomes
`error BAD_REQUEST "something went wrong"` (details only in CloudWatch). Always `{statusCode: 200}`.

Room state = the engine's `GameState` in the META item, changed ONLY through `withRoom(code, fn)` (`lib/mutate.ts`; `fn` is pure
and re-run on version conflicts, side effects run after it returns). A conflict that never clears (5 tries) answers
`BAD_REQUEST "room is busy, try again"`. Player secrets/sockets are separate PLAYER items; `CONN#` finds the player of a socket.

| Action | Sends |
|---|---|
| `ping` | `pong` (also touches the room so a pinging lobby does not idle-expire) |
| `tvPair` | `pairCode {code, expiresAt}` |
| `createRoom` | creator: `roomCreated` + `snapshot`; paired TV: `paired {roomCode, tvToken}` + `snapshot` |
| `joinRoom` | joiner: `joined` + `snapshot`; `players` to TV + host (everyone while in the lobby) |
| `rejoin` | `snapshot`; `players` to TV + host + opponent |
| `tvRejoin` | TV: `snapshot`; phones: `tvStatus {connected:true}` |
| `leaveRoom` | `left`; `players` as above |
| `updateSettings` | `settings` to everyone (lobby only) |
| `startGame` / `playAgain` / `endGame` | `state` to each recipient with their own view (`endGame` in the lobby closes the room: `roomEnded`) |
| `kickPlayer` | target: `kicked`; `players` as above (+ `state`/`reveal` if a contestant forfeits) |
| `makeHost` | `hostChanged` to everyone |
| `submitAnswer` | `submitted {contestantId}` to everyone on the first submission (edits only re-ack the author); then settle if both are in |
| `castVote` | `voteAck` to the voter; `voteCount {have, need}` to the TV only, TV mode only; then settle if all voted |
| `chooseTieBreak` | `ack`; settle if both chose |
| `advance {phaseId}` | nothing on STALE_PHASE / TOO_EARLY; otherwise the phase push below |

A phase change is ONE message per recipient: `state` (or `reveal` when the new phase is reveal) =
`{view, nextDeadline, moves?}`. `view` is `viewFor` for that recipient plus `view.match.prompt` (the prompt text; the bank is never
sent). Answer text appears only from the vote phase, authors only in `reveal`. `moves` (hill changes) rides on the transition push.
There is no typing event and no server tick. Every frame has `serverNow`; every frame that carries room state has `nextDeadline`
(arm one timer, then send `advance {phaseId}`).

## The settle routine (`actions/settle.ts`)

The server has no timers, so overdue deadlines are processed lazily by calling the engine's `advance` for the room's current
phase: `getRoom` -> (load answers/votes for the phase) -> `withRoom(advance)` -> announce. It runs
1. on every `advance` action (clients fire it when `nextDeadline` passes),
2. right after a phase can end early: both answers in, all votes in, both tie choices in,
3. on `joinRoom`, `rejoin`, `tvRejoin` and `$disconnect` (`lazy`: skipped when nothing is due), so grace periods (15 s contestant,
   30 s host), the 60 s pause and phase deadlines are caught up whenever anyone shows up.

`rejoin` settles BEFORE reconnecting the player, so a contestant who was away past the grace has forfeited first.
Stale / too-early calls cost one read, no write, no message.

## Tests

`cd party-backend && npm run typecheck && npm test`. Per-action tests sit next to each action. Test tooling in `src/testing/`:
`fakeDb.ts` (in-memory db with the real semantics, swapped in with `vi.mock("@party/shared/src/db", ...)`), `fakeSender.ts`
(records every message per connection, a closed connection answers like a 410), `world.ts` (fake API Gateway + clock + seeded
rng in front of the real handler), `game.ts`/`bot.ts` (bots that act only on what they were sent).

Full-game test through the public handler: `npx vitest run src/integration.test.ts` (3/4/7/10 players, 1 and 2 rounds, TV and
phone mode; checks secrecy, voteCount routing, no typing event, frame size, no error frames).
`PRINT_BUDGET=1 npx vitest run src/integration.test.ts` prints the message count per game. Reconnect/chaos: `src/chaos.test.ts`.

## Example: 3-player game with a TV (abbreviated, `view` shortened)

```
TV  -> {"action":"tvPair"}
TV  <- {"event":"pairCode","code":"9236","expiresAt":1700000600000,"serverNow":1700000000000}
P1  -> {"action":"createRoom","name":"P1","mode":"tv","pairCode":"9236","settings":{"rounds":1}}
P1  <- {"event":"roomCreated","roomCode":"SUJT","playerId":"lhcisc9w","token":"FM02..."}
P1  <- {"event":"snapshot","view":{"phase":"lobby","you":{"role":"crowd","isHost":true},...},"nextDeadline":null}
TV  <- {"event":"paired","roomCode":"SUJT","tvToken":"LTED..."}      TV <- {"event":"snapshot","view":{"phase":"lobby",...}}
P2  -> {"action":"joinRoom","roomCode":"SUJT","name":"P2"}
P2  <- {"event":"joined","playerId":"5t0pr079","token":"oSH5..."}     P2 <- {"event":"snapshot",...}
P1, TV <- {"event":"players","players":[{"id":"lhcisc9w","name":"P1","online":true,"host":true,...},{"id":"5t0pr079",...}],"hostId":"lhcisc9w"}
(P3 joins the same way)
TV  -> {"action":"startGame"}
everyone <- {"event":"state","view":{"phase":"intro","phaseId":1,"endsAt":1700000005000,
             "you":{"role":"contestant"},   // P1 is "bye", the TV has no "you"
             "match":{"n":1,"kind":"preliminary","contestants":["5t0pr079","qm2j1smq"],"prompt":"Name of a fancy hotel for chickens",...}},
             "nextDeadline":1700000005000,"serverNow":1700000000000}
(5 s later) TV -> {"action":"advance","phaseId":1}
everyone <- {"event":"state","view":{"phase":"write","phaseId":2,"endsAt":1700000050000,...},"nextDeadline":1700000050000}
P2  -> {"action":"submitAnswer","text":"Cluck Inn"}      everyone <- {"event":"submitted","contestantId":"5t0pr079"}
P3  -> {"action":"submitAnswer","text":"Hen Seasons"}    everyone <- {"event":"submitted","contestantId":"qm2j1smq"}
        (both in: the server settles at once)
everyone <- {"event":"state","view":{"phase":"vote","phaseId":3,"match":{"sides":{"A":"Hen Seasons","B":"Cluck Inn"},...}}}
P1  -> {"action":"castVote","side":"B"}
P1  <- {"event":"voteAck","side":"B"}       TV <- {"event":"voteCount","have":1,"need":1}      (phone-only mode: no voteCount)
everyone <- {"event":"reveal","view":{"phase":"reveal","phaseId":4,"match":{"votes":{"A":0,"B":1},
             "result":{"outcome":"win","reason":"votes","winner":"5t0pr079","loser":"qm2j1smq"},
             "authors":{"A":"qm2j1smq","B":"5t0pr079"},...}},"nextDeadline":1700000013000}
(8 s later) TV -> {"action":"advance","phaseId":4}
everyone <- {"event":"state","view":{"phase":"transition",...},"moves":[{"id":"lhcisc9w","from":null,"to":"champion"},...]}
... later: {"event":"state","view":{"phase":"final","king":"5t0pr079",...},"nextDeadline":null}
```

Reconnect: new socket -> one `rejoin {roomCode, playerId, token}` -> `snapshot` (includes `you`, your own answer/vote, `nextDeadline`).
A bad token or an unknown player is `TOKEN_INVALID`; a kicked player gets `KICKED`.

## Decisions where the docs were silent

- `$disconnect` clears the socket FIRST (conditional on the player still being on that socket), then marks offline. A late
  disconnect of an old socket must not take down a player who already reconnected.
- `endGame` mid-game or in `final` = back to the lobby (api.md); `endGame` while already in the lobby closes the room (`roomEnded`
  reason `host`, ENDED tombstone). That is the only trigger for `roomEnded`; nothing emits `idle` yet (idle rooms just expire).
- `submitted` goes to everyone only the first time a contestant submits (api.md: at most 2 per match); edits re-ack the author.
- Pairing: the TV gets `paired` with a `tvToken` (store it; `tvRejoin` needs it). Mode `tv` without a `pairCode` creates a room no TV
  can attach to later (there is no attach action).
- Sockets the sender reports as gone (410) are run through the `$disconnect` path after the request, once each.
- Inbound rate limit: the first message over 10/s in a window gets one `RATE_LIMITED`, the rest of the window is dropped silently
  (so an attacker cannot make us send a frame per message).
- Frames for a full 10-player room reach about 2.2 KB (`state` carries roster + hills), just over the 2 KB sender warning.
