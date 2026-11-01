import React from "react";
import Countdown from "../../components/Countdown";
import { MIN_PLAYERS } from "../../config";
import { useParty } from "../../state/PartyContext";

/** Paused for lack of players. Idle ping keeps the socket alive here. */
export default function PhonePaused() {
  const { state } = useParty();
  return (
    <section className="party-center" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h1 className="party-title">Game paused</h1>
      <p>Waiting for at least {MIN_PLAYERS} players to be connected.</p>
      <p>Back to the lobby in <Countdown endsAt={state.view.pausedUntil} /></p>
    </section>
  );
}
