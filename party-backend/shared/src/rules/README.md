# Rules engine ("Funniest Answer")

Pure, deterministic game engine for `docs/game-rules-spec.md` (v4). No AWS, no I/O, no `Date.now()`, no
`Math.random()`: callers pass `now` (ms) and an `rng: () => number` (`mulberry32(seed)` is provided). State is plain
JSON (about 2 KB, stays under 20 KB in tests) and is stored as the single ROOM `META` item. Answers and votes are NOT
in state; the handler stores them (`ANSWER#..`, `VOTE#..`) and hands them to `advance` when they matter.

Every state-changing function returns `{ state, events, signal?, earlyEnd? }` (a NEW state, the input is never
mutated) or `{ error: ErrorCode }` (codes from `docs/api.md`). Nothing throws on bad input.

## Public API (`import ... from "@party/shared/src/rules"`)

```ts
createLobby(code, hostId, hostName, settings: Partial<Settings>, mode: "tv"|"phone", now): GameState
addPlayer(s, id, name, now, rng): Res        // NAME_INVALID NAME_TAKEN ROOM_FULL FINALE_IN_PROGRESS
removePlayer(s, id, now, rng): Res           // Leave. Lobby: deleted. Game: marked left, hill kept, forfeits now
markOffline(s, id, now, rng): Res            // $disconnect. Grace of GRACE_MS (15 s) before a contestant forfeits
rejoinPlayer(s, id, now, rng): Res           // KICKED / TOKEN_INVALID (unknown id). Token check is the handler's
kickPlayer(s, byId, targetId, now, rng): Res // NOT_HOST
makeHost(s, byId, targetId): Res
updateSettings(s, byId, patch): Res          // NOT_HOST GAME_STARTED BAD_REQUEST
startGame(s, byId /* host id or 'tv' */, promptIds, now, rng): Res   // NOT_ENOUGH_PLAYERS GAME_STARTED
backToLobby(s, byId): Res                    // endGame / playAgain
validateAnswer(s, playerId, text, now): { ok: true, text, ak } | { error }  // trimmed text, key to store under
validateVote(s, voterId, side, now): { ok: true, vk } | { error }
chooseTieBreak(s, playerId, choice, now): Res   // stores the choice in state; Ok.earlyEnd = both chose, call advance
isWriteComplete(s, answerCount): boolean        // hint for early end
isVoteComplete(s, voteCount): boolean           // hint for early end (advance recomputes exactly)
advance(s, { phaseId, now, rng, promptIds, answers?, votes? }): Ok   // answers: Record<contestantId,text>, votes: Record<voterId,"A"|"B">
nextDeadline(s): number | null                  // earliest time advance could change anything (phase end, grace, host, pause)
viewFor(s, playerId | "tv", { ownAnswer?, myVote? }): View
estimateMinutes(players, rounds, { writeSecs, voteSecs, oddPlayerStart }): number
```

`Ok.signal`: `"STALE_PHASE"` (caller's `phaseId` is old) or `"TOO_EARLY"` (nothing due, nothing changed). In both cases
`result.state === input state` (same object), `events` is empty: the handler treats it as success and does not save.

### Worked example: one handler call each

```ts
// submitAnswer { text }
const v = validateAnswer(state, playerId, text, now);
if ("error" in v) return sendError(v.error);
await putAnswer(code, v.ak, playerId, v.text);                 // db layer
send(tv, { event: "submitted", contestantId: playerId });
if (isWriteComplete(state, await countAnswers(code, v.ak))) await settle();

// advance { phaseId }  (also used by settle() above, rejoin, and the timers)
async function settle() {
  const state = await loadRoom(code);
  const m = state.match;
  const r = advance(state, {
    phaseId, now: Date.now(), rng: Math.random, promptIds: PROMPT_IDS,
    answers: state.phase === "write" && m ? await getAnswers(code, m.ak) : undefined,
    votes: state.phase === "vote" && m ? await getVotes(code, m.vk) : undefined,
  });
  if (r.signal) return;                                         // STALE_PHASE / TOO_EARLY: harmless
  await saveRoom(code, r.state, /* version condition */);
  for (const e of r.events) broadcast(e);                       // phaseChanged -> `phase` event with viewFor per recipient
}
```

`rng: Math.random` is fine in the Lambda; tests use `mulberry32`. Per recipient, send `viewFor(state, id, {ownAnswer,
myVote})` as the `snapshot` / `phase` payload. `viewFor` never contains `flip`, never contains answer text before
the vote phase, and contains authors only in the `reveal` phase.

## State shape (`GameState`, see `types.ts`)

`code, mode, hostId, settings, players[], phase, phaseId, phaseEndsAt, pausedAt?, pausedUntil?, act (0 to 4), round,
queue[] (planned matches of this act), match?, matchNo, results[], byes[], valley {champion[], comeback[]}, sat[],
finale? {stage, alive[], lc?, rounds[]}, usedPromptIds[], king?`.

- `phase`: `lobby | intro | write | vote | tiebreak | reveal | transition | final`.
- `player`: `id, name, hill (stored, survives leaving), online, offlineSince?, connectedAt, left?, kicked?, pending?, forfeited?`.
  `pending` = crowd until the next Act 2 (late joiner, returner, forfeiter). "Active" = online and not left/kicked.
- `match`: `n, kind, a, b, fate?, promptId, rp/vt (reprompts, revotes), ak (answer key), vk (vote key), startHill, texts?, choices?, out?`.
  Store answers under `ak` and votes under `vk`; both keys change when a reprompt / revote starts. `flip` (which
  contestant is side A) is secret.
- Act numbers: 1 Preliminaries, 2 Hill brackets, 3 Valley, 4 Finale (Last Chance first, then bracket rounds).

## Events (`EngineEvent`)

`players`, `settings`, `hostChanged`, `kicked`, `paused {until}`, `resumed {endsAt}`, `lobby {reason}`,
`phaseChanged {phase, phaseId, endsAt}`, `matchStarted {n, kind, a, b, fate?, promptId, replay?}`,
`reveal {outcome win|tie|identical|forfeit, reason, winner?, votes?, texts?, authors?}` (authors only when the reveal
phase starts, not for a tie going to tiebreak), `playerForfeited`, `hills {champion, comeback, valley, sitsOut, moves, finale?}`
(after every act / finale round: also the Last Chance pairing and finale tree), `gameEnded {king}`.

## Flow notes

- One phase per `advance` call. The next deadline is `now` + duration, so a late call never shortens the next phase.
- Hill moves are applied at the end of each act (shown in the `transition` phase); until then a player's `hill` is what
  they started the act with (which is what tie rules use).
- Contestant forfeit/leave/kick: the match jumps to `reveal` (outcome `forfeit`, opponent wins) right away.
  If the contestant was merely offline, `nextDeadline` gives the moment (`offlineSince + 15 s`) to call `advance`.
- Fewer than 3 active players: `pausedUntil = now + 60 s`, nothing advances; 3 active again resumes (deadline pushed
  back by the paused time, offline players get a fresh grace); after 60 s the room returns to the lobby.
- Host handoff: leave/kick is immediate; offline for 30 s hands over to the longest-connected active player.

## Swappable rule functions (all pure, one file each)

| Function | Default |
|---|---|
| `resolveTieChoice(a, b)` (`resolveTie.ts`) | both agree = that choice; disagree or missing = `revote` (ON HOLD) |
| `breakTie(match, rng)` (`resolveTie.ts`) | second tie: higher hill at match start wins; same hill / Act 1 / Last Chance / Finale random |
| `pickByes(ids, count, sat, rng)` | random sitter; nobody twice before everyone has |
| `pickFateDecider(candidates, sitters, rng)` | prefer someone who sat out Act 2, else random |
| `mergeSettings` (`settings.ts`) | write 10 to 120 s, vote 5 to 60 s, rounds 1 to 3, oddPlayerStart champion/comeback |
| `expectedMatches` / `estimateMinutes` | balanced hills; (write + vote + 30 s) per match; 10 players: 17/23/29 matches = 26/35/44 min |

## Ambiguities and what was chosen

1. Identical / both-blank answers are detected when WRITE ends (no vote phase), shown in a `reveal` phase (8 s), then the
   reprompt starts with no intro. A tie after votes goes to `tiebreak` (8 s), then reprompt or revote.
2. A second tie (after a reprompt or revote) is `win / tiebreaker`, never another replay, including a second
   identical / blank. Valley and fate-decider matches use the same hill rule (hills only change at act end).
3. One answer vs none: the answerer wins by default (`reveal.reason = default`), no vote.
4. Both contestants gone: the winner is picked by `rng` so there is always exactly one winner (both are flagged forfeited).
5. Last Chance winner joins the Finale; the hill field is not changed. With fewer than 2 comeback players, no Last
   Chance (the odd count is handled by byes). If no active champion exists (only possible after mass leaving) every
   active player is a finalist.
6. A returning player who is active when the Finale starts and has the Champion hill IS a finalist (there is no "next
   Act 2" to wait for). Late joiners (hill null) never are.
7. Pause timeout returns to the lobby and keeps each player's stored `hill` for display, but `startGame` resets all hills.
   If everyone but one player leaves the same thing happens (the survivor is not crowned).
8. Joining after the game ended (`final`) is allowed (they are in the lobby for the next game). Rooms hold 10 non-kicked
   players including ones who left (their name and spot stay reserved); kicked records are kept to block rejoin.
9. Away players are excluded at plan time only. A queued match with an absent contestant forfeits when it starts.
10. Fate deciders are only needed when the Valley is uneven. With full attendance halves stay even, so this only
    happens after leaves / late joins.
11. `profanity` is stored but not enforced by the engine (the handler filters).
