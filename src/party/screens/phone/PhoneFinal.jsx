import React from "react";
import KingCard from "../../components/KingCard";
import { useParty } from "../../state/PartyContext";
import { isHost } from "../../state/selectors";
import TvFinal from "../tv/TvFinal";
import StageOrNote from "./StageOrNote";

/** Game over on a phone. Host can play again. */
export default function PhoneFinal() {
  const { state, actions } = useParty();
  const { view } = state;
  const note = (
    <>
      <KingCard view={view} />
      {isHost(view) && (
        <button type="button" className="party-btn" onClick={actions.playAgain}>Play again</button>
      )}
    </>
  );
  return <StageOrNote stage={TvFinal} note={note} />;
}
