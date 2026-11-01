import React from "react";
import Avatar from "./Avatar";

/**
 * Player list. `renderActions(player)` may add per-player controls (host kick / make host).
 * @param {{players: object[], renderActions?: (p: object) => React.ReactNode}} props
 */
export default function Roster({ players, renderActions }) {
  if (!players.length) return <p className="party-hint">No players yet.</p>;
  return (
    <ul className="party-roster" aria-label="Players">
      {players.map((p, i) => (
        <li key={p.id} className={`party-chip${p.online ? "" : " party-chip--offline"}`}>
          <Avatar index={i} />
          <span className="party-chip__name">
            {p.name}
            {p.host && <span className="party-tag"> (host)</span>}
            {!p.online && <span className="party-tag"> (away)</span>}
          </span>
          {renderActions?.(p)}
        </li>
      ))}
    </ul>
  );
}
