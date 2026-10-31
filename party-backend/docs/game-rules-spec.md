# Funniest Answer: bracket rules as the backend will implement them

**Version 4 (Kevin, 2026-10-31): no House, no points, single-elimination finale with lucky losers.** Replaces the earlier "king defends against a queue / reign points" model, which
had no ending. Everything here lives in one pure module (`party-backend/shared/src/rules/`) so any rule can be changed
in one place and unit-tested without AWS. Items marked **Proposal** are my reading, listed in "Open questions".

## Vocabulary

- **Match**: exactly 2 contestants, same prompt, everyone else (the crowd) votes. Same phases as before.
- **Champion Hill** and **Comeback Hill**: the two groups players are sorted into. **The Valley of Shadow**: the
  middle ground where the hill matches' "movers" fight to swap hills.
- **Act**: Act 1 Preliminaries, Act 2 Hill brackets, Act 3 Valley. **Rounds** (host setting) = how many times
  Acts 2 and 3 repeat.
- **Fate decider**: when the Valley has an uneven number of players, the extra Valley player has no partner on the
  other side, so someone from the *opposite* hill (who is not already in the Valley) plays them. The fate decider plays
  for fun only: whatever the result, nothing changes for them.
- **Odd player out**: when the player count is odd, one player gets no preliminary match (a bye). They start in the
  Champion Hill by default; the host can change this to the Comeback Hill in settings. There is no House opponent.
- **No points anywhere.** Nothing is scored. The game is purely about which hill you are in and who wins the Finale.

## Game flow

1. **Lobby**: 3 to 10 players. Host picks the number of rounds (1 to 3, default 1) (and write/vote times, profanity, where the odd player out starts).
2. **Act 1, Preliminaries** (once): everyone plays exactly one match against a random opponent. 10 players = 5
   matches. An odd player out gets a bye and starts in the Champion Hill (setting: or Comeback Hill). Winners go to the Champion Hill, losers to the Comeback Hill.
3. **Rounds** (repeat for the number of rounds chosen):
   - **Act 2, Hill brackets**: inside each hill, players are paired up and play. A hill of 5 = 2 matches and 1 sits
     out. In the Champion Hill, the **losers** of these matches move to the Valley (winners stay). In the Comeback
     Hill, the **winners** move to the Valley (losers stay).
   - **Act 3, Valley**: each Champion Hill loser plays a Comeback Hill winner. **The winner ends up in the Champion
     Hill, the loser in the Comeback Hill** (they swap over if the comeback player wins).
   - **Uneven Valley**: any extra Valley player faces a **fate decider** from the other hill. If the extra player is a
     Champion Hill loser, the fate decider comes from the Comeback Hill; if it is a Comeback Hill winner, from the
     Champion Hill. The extra player gets the normal Valley outcome (win = Champion Hill, lose = Comeback Hill). The
     fate decider stays exactly where they were.
   - Hill membership after Act 3 is what Act 2 uses in the next round.
4. **Finale** (once, after the last round): only Champion Hill players, as a **single-elimination bracket** (lose
   once and you are out). The last one standing is **King of the Hill**. One champion = crowned without a match.
   **Lucky loser (Last Chance):** if the Champion Hill has an odd number of players, so one spot is left open, the
   Comeback Hill plays one extra match first: two random Comeback Hill players, and the winner takes the open Finale
   spot. Champions are never put at risk by this. Later bracket rounds that come out uneven use byes.
5. King announced (plus who reached the final rounds), then Play Again (same players, back to lobby) or the room expires.

"Win twice / lose twice": to climb to the Champion Hill from the Comeback Hill you win twice (your hill match, then
your Valley match). To fall from the Champion Hill you lose twice (hill match, then Valley match).

## Worked example: 10 players, 1 round

| Step | Matches | Result |
|---|---|---|
| Act 1 | 5 | 5 to Champion, 5 to Comeback (9 players: 4 matches + the odd player placed by the setting) |
| Act 2 Champion Hill | 2 (+1 sits out) | 2 winners stay, 2 losers to Valley |
| Act 2 Comeback Hill | 2 (+1 sits out) | 2 winners to Valley, 2 losers stay |
| Act 3 Valley | 2 | 2 players up to Champion, 2 down to Comeback |
| Finale | 4 (5 champions: one bye) | King of the Hill |

About 15 matches, roughly 22 minutes at about 90 seconds a match. Each extra round adds about 6 matches
(about 9 minutes). Matches run one at a time so the whole room can watch and vote.

## Match rules (unchanged from the Figma rulings)

Write 45s, vote 15s, reveal 8s, intro 5s; answer 1 to 60 characters; blank = "Write something!"; profanity blocked
inline; identical answers = "Great minds" tie; one answer vs none: the answerer wins; neither: tie. Contestants cannot
vote; one vote each, changeable until time ends; late votes never count; a vote already cast survives a disconnect.
Contestant who drops: 15s grace, then forfeit (opponent wins by default).
Connection, host handoff, pause under 3 connected players, 2-minute spot hold, 30-minute idle expiry, TV pairing:
unchanged. Joining: 3 to 10, 4-letter code, names 1 to 12 characters unique and filtered.

## Decided

- No House opponent: an odd player out is placed straight into a hill (host setting, default Champion Hill).
- No points, no reign, no leaderboard.
- Finale is single elimination among Champion Hill players; one champion is crowned without a match.
- Uneven Valley: the extra player plays a fate decider from the opposite hill; the fate decider is unaffected (plays for fun).
- Rounds: host chooses 1 to 3, default 1.
- Finale uses the lucky-loser rule (one extra Comeback Hill match fills an open spot) instead of leaving a gap.
- A returning player goes back to the hill they left. The server stores each player's hill (`hill`) so it survives disconnects.
- Ties: the two contestants choose Reprompt or Revote. Leavers (including dropped phones) are removed from brackets but can rejoin before the Finale; only kicked players cannot.
- No typing signal; vote count live on the TV only in TV mode, total at reveal in phone-only mode.

## Ties (decided: the two contestants choose)

A tie is equal votes, zero votes, identical answers, or both blank. Both contestants get a short choice screen (about
8s) with two options:

- **Reprompt**: a new prompt, both write again.
- **Revote**: the same two answers, the crowd votes again.

If both pick the same option, that happens. **ON HOLD (Kevin: revisit later):** if they pick different options, or one
or both do not pick in time, the default for now is **Revote** (it is the quicker one). Identical or blank answers make a revote pointless, so those
force **Reprompt**. To stop endless loops, *proposal:* a second tie after the replay is decided by the player already in
the higher hill (random in Act 1). In the Finale, a second tie is decided randomly.

## Leaving and coming back (decided)

- A player can be gone for many reasons (phone died, tab closed, tapped Leave). They are treated the same: removed
  from the brackets while away, and the **game goes on without them**. A match they are in is forfeited after the 15s
  grace (counts as a loss).
- **They can come back at any time before the Finale starts**, using the stored player id and token ("Welcome back").
  *Proposal:* they return to the hill they were in when they dropped, from the next Act 2 on. Until then they are in the
  crowd and can vote. Their name stays reserved for them.
- Not allowed back: a player the host kicked.
- During the Finale a returning player watches and joins the next game ("Finale is on, join next game").
- A brand-new late joiner enters the Comeback Hill at the next Act 2 (also votes in the crowd until then).
- Bracket sizes are computed from the active players at the start of each act. Fewer than 3 connected players pauses
  the game (60s), as before.

## Open questions (ticket: "DECISIONS NEEDED")

1. **Who sits out in an odd hill (Act 2)?** *Proposal:* random, but nobody sits out twice before everyone has. A bye is
   neutral: no win, no loss, no move.
2. **Fate decider details** (the rule itself is decided).
   - *Who is picked?* Proposal: random from the opposite hill among players not already in the Valley, preferring
     the player who sat out Act 2 (they have played the least).
   - *Not enough fate deciders?* The gap can exceed 1 (e.g. Champion Hill of 1 and Comeback Hill of 9 gives 0 losers vs 4
     winners). Proposal: each extra player gets a different fate decider while there are any left; players who
     cannot get one stay in their hill. The alternative is letting one fate decider play several fun matches.
3. **Last Chance match details.** "One spot left" is read as: the Champion Hill has an odd count. *Proposal:* the two
   contestants are random Comeback Hill players; if the Comeback Hill has fewer than 2 players, the open spot becomes a
   bye. Uneven rounds later in the bracket use byes. Confirm this reading.
4. **ON HOLD: tie choice when the two contestants disagree or do not answer.** Default Revote for now. Revisit.

## What this changes in the design (Figma)

- Remove the House: "You vs The House" (C3), "The House wins this one" (D6), and the House setting. Replace the
  setting with **Odd player starts in: Champion Hill / Comeback Hill**. Add a "You get a bye" screen for the odd player.
- Remove everything points-based: the reign leaderboard (TV scoreboard, phone standings), "+0.5 reign", "Longest
  reign", co-champions by reign, "Winner gets +3 reign". The Final screen shows the King and the Finale bracket.
- Replace queue screens ("you're 2nd in the queue", "Up next: ...", "The king waits", one-player hill, no challengers)
  with bracket and Valley screens: hill rosters, "You sit out this round", "You're in the Valley", per-act progress.
- Settings screen needs a **Rounds** option and the odd-player option.
- Tie screen needs a contestant choice (Reprompt / Revote) with a waiting state for the crowd.
- "Leave the game?" dialog (B6) and the 2-minute "spot held" copy change: you can come back any time before the Finale.
