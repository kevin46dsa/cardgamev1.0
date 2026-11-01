import React from "react";
import { nameOf } from "../state/selectors";

const COLUMNS = [
  { key: "champion", title: "Champion Hill" },
  { key: "valley", title: "Valley of Shadow" },
  { key: "comeback", title: "Comeback Hill" },
];

const arrow = (move) => `${move.from ?? "new"} to ${move.to ?? "out"}`;

/** Hill rosters, who is in the Valley, who sits out, and the latest moves. */
export default function HillsBoard({ view, moves = [] }) {
  const { hills } = view;
  const valley = [...hills.valley.champion, ...hills.valley.comeback];
  const members = { champion: hills.champion, comeback: hills.comeback, valley };
  return (
    <section aria-label="Hills">
      <div className="party-board">
        {COLUMNS.map(({ key, title }) => (
          <div key={key} className="party-card">
            <h3>{title}</h3>
            <ul className="party-list">
              {members[key].length === 0 && <li className="party-hint">Empty</li>}
              {members[key].map((id) => (
                <li key={id} className="party-chip">{nameOf(view, id)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {hills.sitsOut.length > 0 && (
        <p className="party-hint">Sitting out: {hills.sitsOut.map((id) => nameOf(view, id)).join(", ")}</p>
      )}
      {moves.length > 0 && (
        <ul className="party-list" aria-label="Moves">
          {moves.map((m) => (
            <li key={m.id} className="party-hint">{nameOf(view, m.id)}: {arrow(m)}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
