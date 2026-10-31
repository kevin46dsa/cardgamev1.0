import React from "react";
import { useParty } from "../../state/PartyContext";
import TvTransition from "../tv/TvTransition";
import RoleNotice from "./RoleNotice";
import StageOrNote from "./StageOrNote";

const HILL_NAMES = { champion: "Champion Hill", comeback: "Comeback Hill" };

/** Between acts. */
export default function PhoneTransition() {
  const { state } = useParty();
  const { view } = state;
  const hill = HILL_NAMES[view.you?.hill];
  const note = (
    <>
      <h1 className="party-title">Standings</h1>
      <p>{hill ? `You are in the ${hill}.` : "Look at the TV."}</p>
    </>
  );
  return (
    <>
      <StageOrNote stage={TvTransition} note={note} />
      <RoleNotice />
    </>
  );
}
