import React from "react";
import { useParty } from "../../state/PartyContext";
import { isPhoneOnly } from "../../state/selectors";

/**
 * Phone-only rooms have no TV, so the phone shows the shared stage view. With a TV it shows `note` instead.
 * @param {{stage: React.ComponentType, note: React.ReactNode}} props
 */
export default function StageOrNote({ stage: Stage, note }) {
  const { state } = useParty();
  return isPhoneOnly(state.view) ? <Stage /> : <>{note}</>;
}
