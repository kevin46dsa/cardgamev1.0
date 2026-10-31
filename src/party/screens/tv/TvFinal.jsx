import React from "react";
import FinaleBracket from "../../components/FinaleBracket";
import KingCard from "../../components/KingCard";
import { useParty } from "../../state/PartyContext";

/** Game over: the King, the bracket, and Play again. */
export default function TvFinal() {
  const { state, kind, actions } = useParty();
  const { view } = state;
  const canReplay = kind === "tv" || view.you?.isHost;
  return (
    <>
      <KingCard view={view} />
      <FinaleBracket view={view} />
      {canReplay && (
        <button type="button" className="party-btn" onClick={actions.playAgain}>
          Play again
        </button>
      )}
    </>
  );
}
