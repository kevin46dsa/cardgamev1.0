import React from "react";
import { kindLabel, nameOf } from "../state/selectors";
import Countdown from "./Countdown";

/** Kind badge, contestants and optional countdown for the current match. */
export default function MatchHeader({ view, showTimer = true }) {
  const m = view.match;
  if (!m) return null;
  const [a, b] = m.contestants;
  return (
    <header className="party-row" style={{ justifyContent: "space-between" }}>
      <div>
        <p className="party-kind">{kindLabel(m.kind)}</p>
        <h2 className="party-title">
          {nameOf(view, a)} vs {nameOf(view, b)}
        </h2>
      </div>
      {showTimer && <Countdown endsAt={view.endsAt} />}
    </header>
  );
}
