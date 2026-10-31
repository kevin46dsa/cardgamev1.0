import React from "react";
import PromptCard from "../../components/PromptCard";
import { useParty } from "../../state/PartyContext";
import { nameOf } from "../../state/selectors";

/** Tie: the two contestants pick Reprompt or Revote. */
export default function TvTiebreak() {
  const { state } = useParty();
  const { view } = state;
  const [a, b] = view.match.contestants;
  return (
    <section className="party-center" style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
      <h2 className="party-title">It's a tie!</h2>
      <PromptCard prompt={view.match.prompt} />
      <p>{nameOf(view, a)} and {nameOf(view, b)} choose: new prompt or revote.</p>
      <p role="status" className="party-hint">{view.match.chosen?.length ?? 0} of 2 chosen</p>
    </section>
  );
}
