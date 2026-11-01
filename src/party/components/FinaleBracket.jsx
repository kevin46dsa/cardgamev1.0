import React from "react";
import { nameOf } from "../state/selectors";

const pairLine = (view, [a, b], winners) => {
  const won = winners.includes(a) ? a : winners.includes(b) ? b : null;
  return `${nameOf(view, a)} vs ${nameOf(view, b)}${won ? ` (${nameOf(view, won)} advances)` : ""}`;
};

/** Single-elimination Finale: Last Chance match, then each bracket round. */
export default function FinaleBracket({ view }) {
  const f = view.finale;
  if (!f) return null;
  return (
    <section aria-label="Finale bracket">
      <ul className="party-list party-bracket">
        <li className="is-champion">Champion Hill only: {f.alive.map((id) => nameOf(view, id)).join(", ")}</li>
        {f.lc && (
          <li>
            Last Chance: {nameOf(view, f.lc.a)} vs {nameOf(view, f.lc.b)}
            {f.lc.winner ? ` (${nameOf(view, f.lc.winner)} takes the spot)` : ""}
          </li>
        )}
        {f.rounds.map((round, i) => (
          <li key={i}>
            Round {i + 1}: {round.pairs.map((p) => pairLine(view, p, round.winners)).join(" / ")}
            {round.byes.length > 0 && ` / Bye: ${round.byes.map((id) => nameOf(view, id)).join(", ")}`}
          </li>
        ))}
      </ul>
    </section>
  );
}
