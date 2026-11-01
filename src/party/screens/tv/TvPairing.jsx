import React from "react";
import { CONN } from "../../config";
import { useParty } from "../../state/PartyContext";

/** Shown until a phone pairs: the 4-digit code to type into "Create room". */
export default function TvPairing() {
  const { state } = useParty();
  const code = state.pairCode?.code;
  return (
    <section aria-label="Pairing" className="party-center" style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
      <h1 className="party-title">Funniest Answer</h1>
      <p>On your phone, open /party and choose "Create room", then enter this TV code:</p>
      {code ? (
        <p className="party-code" aria-label={`TV code ${code.split("").join(" ")}`}>{code}</p>
      ) : (
        <p role="status" className="party-hint">
          {state.conn === CONN.OPEN ? "Getting a code..." : "Connecting..."}
        </p>
      )}
    </section>
  );
}
