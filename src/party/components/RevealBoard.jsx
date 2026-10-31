import React from "react";
import { SIDES } from "../config";
import { nameOf, resultLine } from "../state/selectors";

/** Answers with authors and vote counts, plus the one-line result. */
export default function RevealBoard({ view }) {
  const { sides, authors, votes, result } = view.match;
  return (
    <section aria-label="Results">
      <h2 className="party-title">{resultLine(view)}</h2>
      <div className="party-answers">
        {SIDES.map((side) => {
          const won = result?.outcome === "win" && result.winner === authors?.[side];
          return (
            <div key={side} className={`party-answer${won ? " party-answer--winner" : ""}`}>
              <span className="party-answer__side">{side}</span>
              {sides?.[side]}
              <span className="party-answer__meta">
                {authors?.[side] ? nameOf(view, authors[side]) : ""}
                {votes ? ` - ${votes[side]} ${votes[side] === 1 ? "vote" : "votes"}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
