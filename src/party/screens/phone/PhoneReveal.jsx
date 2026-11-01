import React from "react";
import { useParty } from "../../state/PartyContext";
import { isContestant, resultLine } from "../../state/selectors";
import TvReveal from "../tv/TvReveal";
import StageOrNote from "./StageOrNote";

/** Reveal: full board in phone-only mode, short personal result with a TV. */
export default function PhoneReveal() {
  const { state } = useParty();
  const { view } = state;
  const { result } = view.match;
  const mine = isContestant(view);
  const personal = !mine ? null : result?.winner === view.you.id ? "You won this one!" : result?.winner ? "You lost this one." : null;
  const note = (
    <>
      <h1 className="party-title">{personal ?? resultLine(view)}</h1>
      <p>{personal ? resultLine(view) : "Look at the TV for the reveal."}</p>
    </>
  );
  return <StageOrNote stage={TvReveal} note={note} />;
}
