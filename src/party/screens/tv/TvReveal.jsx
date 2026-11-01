import React from "react";
import RevealBoard from "../../components/RevealBoard";
import { useParty } from "../../state/PartyContext";

/** Reveal: authors, votes and the winner. */
export default function TvReveal() {
  const { state } = useParty();
  return <RevealBoard view={state.view} />;
}
