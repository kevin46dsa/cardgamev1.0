import React from "react";
import Countdown from "../../components/Countdown";
import FinaleBracket from "../../components/FinaleBracket";
import HillsBoard from "../../components/HillsBoard";
import { useParty } from "../../state/PartyContext";

/** Between acts: where everyone stands, and the Finale bracket once it exists. */
export default function TvTransition() {
  const { state } = useParty();
  const { view, moves } = state;
  return (
    <>
      <header className="party-row" style={{ justifyContent: "space-between" }}>
        <h2 className="party-title">{view.finale ? "Finale" : `Standings, round ${view.round}`}</h2>
        <Countdown endsAt={view.endsAt} />
      </header>
      {view.finale ? <FinaleBracket view={view} /> : <HillsBoard view={view} moves={moves} />}
    </>
  );
}
