import React from "react";
import Roster from "../../components/Roster";
import { MAX_PLAYERS } from "../../config";
import { useParty } from "../../state/PartyContext";
import { canStart, isHost } from "../../state/selectors";
import HostSettings from "./HostSettings";

/** Lobby: room code, roster, host powers (settings, kick, make host, start) and Leave. */
export default function PhoneLobby() {
  const { state, actions } = useParty();
  const { view } = state;
  const host = isHost(view);
  const ready = canStart(view);
  const hostControls = (p) =>
    host && p.id !== view.you.id ? (
      <span className="party-row" style={{ gap: 6 }}>
        <button type="button" className="party-btn party-btn--ghost party-btn--small" onClick={() => actions.makeHost(p.id)} aria-label={`Make ${p.name} host`}>Host</button>
        <button type="button" className="party-btn party-btn--danger party-btn--small" onClick={() => actions.kickPlayer(p.id)} aria-label={`Remove ${p.name}`}>Kick</button>
      </span>
    ) : null;
  return (
    <>
      <section className="party-card" aria-label="Room code">
        <p className="party-hint">Room code</p>
        <p className="party-code" style={{ fontSize: "3rem" }}>{view.code}</p>
        <p className="party-hint">
          {view.settings.rounds} {view.settings.rounds === 1 ? "round" : "rounds"}, about {view.estimatedMinutes} min
        </p>
      </section>
      <h2 className="party-title" style={{ fontSize: "1.3rem" }}>Players {view.players.length} / {MAX_PLAYERS}</h2>
      <Roster players={view.players} renderActions={hostControls} />
      {host && <HostSettings settings={view.settings} onChange={actions.updateSettings} />}
      {host ? (
        <button type="button" className="party-btn" disabled={!ready} onClick={actions.startGame}>Start game</button>
      ) : (
        <p role="status" className="party-hint">Waiting for the host to start.</p>
      )}
      {host && !ready && <p role="status" className="party-hint">You need at least 3 players.</p>}
      <button type="button" className="party-btn party-btn--ghost" onClick={actions.leaveRoom}>Leave game</button>
    </>
  );
}
