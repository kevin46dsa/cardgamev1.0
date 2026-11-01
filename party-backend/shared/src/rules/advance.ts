import { hillsEvent, snapshotHills } from "./hillsEvent";
import { earlyEnd, endTiebreak, forfeitAbsent, replay, resolveVote, resolveWrite, setPhase, startMatch, type Ctx } from "./match";
import { planNext } from "./planNext";
import { reconcile } from "./reconcile";
import { type AdvanceInput, type EngineEvent, type GameState, type Ok, TRANSITION_MS } from "./types";
import { clone } from "./util";
import { NO_TIMER } from "./types";

function step(s: GameState, i: AdvanceInput, c: Ctx, events: EngineEvent[]): void {
  switch (s.phase) {
    case "intro":
      return setPhase(s, "write", NO_TIMER, events);
    case "write":
      return resolveWrite(s, i.answers ?? {}, c, events);
    case "vote":
      return resolveVote(s, i.votes ?? {}, c, events);
    case "tiebreak":
      return endTiebreak(s, c, events);
    case "reveal": {
      if (s.match?.after) return replay(s, "reprompt", c, events);
      if (s.queue.length) return startMatch(s, c, events);
      const before = snapshotHills(s);
      planNext(s, c.rng);
      delete s.match;
      events.push(hillsEvent(s, before));
      if (s.king) {
        events.push({ type: "gameEnded", king: s.king });
        return setPhase(s, "final", 0, events);
      }
      return setPhase(s, "transition", i.now + TRANSITION_MS, events);
    }
    case "transition":
      return startMatch(s, c, events);
  }
}

// Idempotent and safe early or late. Moves at most one phase per call (the next deadline is `now` + duration).
// Stale phaseId or nothing to do: returns the SAME state object with `signal`, never throws.
export function advance(state: GameState, i: AdvanceInput): Ok {
  if (i.phaseId !== state.phaseId) return { state, events: [], signal: "STALE_PHASE" };
  const s = clone(state);
  const events: EngineEvent[] = [];
  const c: Ctx = { now: i.now, rng: i.rng, promptIds: i.promptIds };
  reconcile(s, c, events);
  const live = s.phase !== "lobby" && s.phase !== "final" && s.pausedAt === undefined;
  if (live && s.phaseId === state.phaseId && ((s.phaseEndsAt > 0 && i.now >= s.phaseEndsAt) || earlyEnd(s, i.answers, i.votes))) step(s, i, c, events);
  forfeitAbsent(s, c, events); // a match that just started may already have an absent contestant
  if (JSON.stringify(s) === JSON.stringify(state)) return { state, events: [], signal: "TOO_EARLY" };
  return { state: s, events };
}
