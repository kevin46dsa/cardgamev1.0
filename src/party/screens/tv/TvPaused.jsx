import React from "react";
import Countdown from "../../components/Countdown";
import { MIN_PLAYERS } from "../../config";
import { useParty } from "../../state/PartyContext";

/** Paused: fewer than 3 connected players. Back to the lobby when the timer runs out. */
export default function TvPaused() {
  const { state } = useParty();
  return (
    <section className="party-center" style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
      <h2 className="party-title">Game paused</h2>
      <p>Waiting for at least {MIN_PLAYERS} players to be connected.</p>
      <p>Back to the lobby in <Countdown endsAt={state.view.pausedUntil} /></p>
    </section>
  );
}
