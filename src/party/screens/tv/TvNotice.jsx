import React from "react";
import { useParty } from "../../state/PartyContext";

/** Room ended. A new pairing code is requested after the button. */
export default function TvNotice() {
  const { actions } = useParty();
  return (
    <section className="party-center" style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
      <h2 className="party-title">This game has ended</h2>
      <button type="button" className="party-btn" onClick={actions.reset}>
        Start a new room
      </button>
    </section>
  );
}
