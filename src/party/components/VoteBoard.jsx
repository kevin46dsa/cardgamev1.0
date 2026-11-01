import React from "react";
import { SIDES } from "../config";

/**
 * The two answers. Interactive (toggle buttons) when `onVote` is given, static otherwise.
 * @param {{sides: {A: string, B: string}, myVote?: string|null, onVote?: (side: string) => void}} props
 */
export default function VoteBoard({ sides, myVote = null, onVote }) {
  return (
    <div className="party-answers">
      {SIDES.map((side) =>
        onVote ? (
          <button key={side} type="button" className="party-answer" aria-pressed={myVote === side} onClick={() => onVote(side)}>
            <span className="party-answer__side">{side}</span>
            {sides[side]}
          </button>
        ) : (
          <div key={side} className="party-answer">
            <span className="party-answer__side">{side}</span>
            {sides[side]}
          </div>
        ),
      )}
    </div>
  );
}
