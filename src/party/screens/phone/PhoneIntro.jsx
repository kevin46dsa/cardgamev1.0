import React from "react";
import { useParty } from "../../state/PartyContext";
import { isContestant, nameOf, opponents } from "../../state/selectors";
import TvIntro from "../tv/TvIntro";
import RoleNotice from "./RoleNotice";
import StageOrNote from "./StageOrNote";

/** Match intro on a phone. */
export default function PhoneIntro() {
  const { state } = useParty();
  const { view } = state;
  const [opponent] = opponents(view);
  const note = isContestant(view) ? (
    <h2 className="party-title">You're up against {nameOf(view, opponent)}. Get ready to write!</h2>
  ) : (
    <h2 className="party-title">Next match starting. Get ready to vote!</h2>
  );
  return (
    <>
      <StageOrNote stage={TvIntro} note={note} />
      <RoleNotice />
    </>
  );
}
