import React from "react";
import { PHASE } from "../config";

const TEXT = {
  [PHASE.LOBBY]: "Lobby",
  [PHASE.INTRO]: "Next match",
  [PHASE.WRITE]: "Time to write",
  [PHASE.VOTE]: "Time to vote",
  [PHASE.TIEBREAK]: "It's a tie",
  [PHASE.REVEAL]: "Results",
  [PHASE.TRANSITION]: "Standings",
  [PHASE.FINAL]: "Game over",
};

/** Visually hidden polite live region that announces each phase change. */
export default function PhaseAnnouncer({ phase }) {
  return (
    <div className="party-sr" role="status" aria-live="polite">
      {TEXT[phase] ?? ""}
    </div>
  );
}
