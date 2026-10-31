# Funniest Answer (King of the Hill): feasibility and cost scan

Source: Figma file "Quiplash Game", all 3 pages (wireframes, 27 hi-fi frames, edge-case rows A to G, and the
"Review / Gaps + rulings" frame that is declared to be the backend spec). Scanned 2026-10-31.
Not yet scanned in detail: the core TV/phone frames for answering, voting and reveal (rules for those come from the
wireframe flow page and rulings). Re-scan when the design settles.

## Verdict

Feasible on the current stack (API Gateway WebSocket + one Lambda + DynamoDB). Nothing in the design needs polling,
a server-side timer fleet, or any new AWS service. Honest-play cost is well under 1 US cent per 18-minute game.
The real cost risks are abuse and bugs (runaway loops, bots), not normal play. Two things need your attention first:

1. **Lambda concurrency limit on this AWS account is 10** (all apps share it). A burst of 10 simultaneous phone
   actions uses it all and would also throttle Kanban and OffTheFrame. Request a quota increase (Service Quotas, free)
   before the 10-player smoke test. We also cannot use reserved concurrency as a circuit breaker until it is raised.
2. **The hill-phase rules do not terminate as written** (see game-rules-spec.md, question 1). Needs your decision
   before the rules engine is written.

## Rule for the whole system: the server never ticks

All countdowns (45s write, 15s vote, 8s next round, 15s forfeit grace, 12s "then Maya wins by default", 60s pause,
10 min pairing code, 2 min spot hold) are rendered by each client from a server-sent absolute `endsAt` timestamp.
No tick messages. No client polling. The server only sends on state changes.

Client clock skew: every server message carries `serverNow`; clients compute an offset once and use it.

## How phases advance without a server timer

Lambda has no memory between calls, so no `setTimeout` on the server. Design:

- Room state stores `phaseId` (increasing integer) and `phaseEndsAt`.
- Every connected client sets ONE local timer for `phaseEndsAt` and then sends `advance {phaseId}`.
- Server accepts it only if `now >= phaseEndsAt` and `phaseId` still matches (conditional write). First caller wins,
  everyone else gets a harmless no-op. Redundancy: the TV/host fires at `endsAt`, other clients fire at `endsAt + 3s`
  only if no newer `phaseId` has arrived. Normal cost: 1 extra call per phase.
- Early finish (both answered, everyone voted) is decided by the server inside `submitAnswer` / `castVote`.
- Failure mode: if every client is asleep, the game freezes. It resumes the moment anyone reconnects, because
  `rejoin` first settles any overdue deadline. Abandoned rooms vanish by DynamoDB TTL.
- Upgrade path if this ever proves flaky: EventBridge Scheduler one-shot schedule per phase (about $1 per million).
  Not needed for v1.

## Hotspots found in the design, and the cheap fix for each

| Where in Figma | Naive implementation | What we do instead |
|---|---|---|
| "Typing..." meter for the crowd (flow page, Crowd watching writers) | Stream keystrokes: about 270 msgs in + 2,400 fan-out per match | **Decided (Kevin): no typing signal at all.** Crowd phones show a static "Waiting for the writers" state. The only write-phase update is a contestant submitting (2 events per match, no text) |
| "5 of 8 votes in", "Waiting for 3 more votes" | Broadcast every vote to everyone | **Decided (Kevin):** TV mode: live vote count on the TV only. Phone-only mode: no live count anywhere; the total appears once everyone has voted or time is up (in the reveal). Contestant and voter screens show static "waiting" copy, so the Figma wording with counts (rows C7, D1) must change |
| Submitted indicators | Fine as is | A `submitted` event (contestant id only, no text) when a contestant locks in: at most 2 per match |
| Presence ("Dev (offline)", "Dev lost connection") | Broadcast every connect/disconnect | Only to TV, host, and the current opponent. Phones locking and unlocking cause churn |
| Reconnect (Row F, phones lock constantly) | Fixed 1s retry forever, every phone | Backoff 1,2,4..30s as designed, plus: stop retrying while the page is hidden, retry on `visibilitychange`, manual "Try again" after 2 minutes. `rejoin` returns a full snapshot in one message |
| Keepalive | Ping every few seconds | API Gateway idle timeout is 10 min and server pushes count as activity. During play something is sent at least every 90s. Only lobby, pause and TV pairing screens need a ping, every 5 min |
| TV pairing code expiring every 10 min | Fine | Regenerate on expiry (1 call per 10 min per idle TV). Stop regenerating after 30 min idle |
| Voting/answer persistence | Rewrite one shared Room item per vote (conflicts and retries) | Answers and votes are one item per player (`ANSWER#..`, `VOTE#..`). No contention, naturally idempotent and editable |
| Wake lock, fullscreen, remote focus | n/a | Frontend only. Zero backend cost |

## Cost model (approximate, verify current pricing before relying on it)

Assumptions: 10 phones + 1 TV, 12 matches, 5 phases per match, about 18 minutes.

| Item | Per game, our design | Per game, naive keystroke + broadcast-everything |
|---|---|---|
| Client to server messages | about 350 | about 3,500 |
| Server to client pushes | about 1,500 | about 30,000 |
| Lambda invocations | about 350 (plus $disconnects) | about 3,500 |
| DynamoDB ops | about 900 | about 8,000 |
| Rough dollars | under $0.005 | about $0.05 |

Public prices used: API Gateway WebSocket about $1.00 per million messages and $0.25 per million connection-minutes;
Lambda $0.20 per million requests; DynamoDB on-demand about $0.625 per million writes and $0.125 per million reads.
Lambda has a permanent free tier of 1M requests per month. API Gateway's WebSocket free tier lasts 12 months from
account creation, so do not count on it.

Even 100 games a month is pennies. The naive version is also cheap, but it multiplies load 10x for nothing and makes
the 10-concurrency Lambda limit a real problem.

## Abuse and runaway protection (cost circuit breakers)

The WSS URL is public and so is this repo. Planned guardrails (ticket: Safety + abuse):

- API Gateway stage throttle (set to 30 rps / 60 burst).
- Per-connection message limit inside the Lambda (counter on the player item; drop and warn above about 10 msgs/s).
- `createRoom` limited per source IP (counter item with TTL, about 10 rooms per hour).
- Done: wrong room codes, tokens and pairing codes are limited to 20 per 10 minutes per source IP (`RATE_LIMITED`), and `tvPair` to 20 codes per 10 minutes per IP. Original note: pairing-code and room-code guessing limited per connection (4 letters without O/I is only 24^4 = 331k codes).
- Reject any inbound frame over 2 KB (answers are 60 characters).
- Reserved Lambda concurrency as a hard ceiling once the account limit is raised.
- You already have a "Zero-Spend" $1 AWS Budget alert. Keep it. No WAF (about $5 per month minimum, wrong tool here).

## Feasibility notes on specific Figma items

- Phone-only vs TV mode: same server rules, same events. Phone-only just means every phone renders the TV views.
  No extra backend. Host is a player (phone-only) or the creating phone with the TV as a display and remote.
- "Welcome back" and "same device rejoins": needs a client-stored `playerId` + secret `token` (localStorage, not
  sessionStorage, because a restored mobile tab may lose sessionStorage). Existing Connection ticket said
  sessionStorage; corrected.
- 15s forfeit grace is tight against a phone that locks. iOS drops the socket on lock within about a second and
  reconnecting takes 1 to 3s after unlock. Works as designed, but a contestant who locks their phone for 15s forfeits.
  That is a design choice, flagging it.
- "Room ended" vs "can't find room": DynamoDB TTL deletes lazily (up to about 48 hours late) and a deleted room is
  indistinguishable from a wrong code. Keep a small `ENDED` tombstone on the room META item for 24 hours.
- Content work, not engineering: a prompt bank (at least 40 prompts; 12 matches per game, no repeats within a game),
  and a profanity word list (the House was removed, so no House answers are needed). Ticketed separately.
- Sudden death repeats "until someone wins". Add a safety cap (proposal: 5 rounds then co-champions).
- There are no points in the game, so there is no score to store or leaderboard to broadcast (less data, less traffic).
- Draw & Guess and Code Clues are not in the Figma file. Their tickets are untouched.
