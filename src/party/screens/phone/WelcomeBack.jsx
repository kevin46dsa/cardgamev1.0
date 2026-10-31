import React from "react";
import { useParty } from "../../state/PartyContext";
import Notice from "./Notice";

const HILL_NAMES = { champion: "Champion Hill", comeback: "Comeback Hill" };

/** Shown once after a successful rejoin mid-game. */
export default function WelcomeBack() {
  const { state, actions } = useParty();
  const { you } = state.view;
  const hill = HILL_NAMES[you.hill];
  return (
    <Notice
      title="Welcome back!"
      body={`${hill ? `You will return to the ${hill} next round. ` : ""}Until then you can watch and vote.${you.forfeited ? " Your last match was forfeited." : ""}`}
      actionLabel="Continue"
      onAction={actions.dismissWelcome}
    />
  );
}
