import React from "react";
import Roster from "../../components/Roster";
import { MAX_PLAYERS, ROUTES } from "../../config";
import { useParty } from "../../state/PartyContext";
import { canStart } from "../../state/selectors";

/** TV lobby: room code, join URL, roster and the Start button. */
export default function TvLobby() {
  const { state, actions } = useParty();
  const { view } = state;
  const ready = canStart(view);
  return (
    <div className="party-tv__split">
      <section className="party-card" aria-label="Join">
        <p className="party-hint">Join on your phone: {window.location.origin}{ROUTES.join}</p>
        <p className="party-code" aria-label={`Room code ${view.code.split("").join(" ")}`}>{view.code}</p>
        <p className="party-hint">
          {view.settings.rounds} {view.settings.rounds === 1 ? "round" : "rounds"}, about {view.estimatedMinutes} min
        </p>
      </section>
      <section>
        <h1 className="party-title">Players {view.players.length} / {MAX_PLAYERS}</h1>
        <Roster players={view.players} />
        <div style={{ marginTop: "1em" }}>
          <button type="button" className="party-btn" disabled={!ready} onClick={actions.startGame}>
            Start game (press Enter)
          </button>
          {!ready && <p className="party-hint" role="status">Waiting for at least 3 players.</p>}
        </div>
      </section>
    </div>
  );
}
