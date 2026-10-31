import React from "react";
import MatchHeader from "../../components/MatchHeader";
import PromptCard from "../../components/PromptCard";
import { useParty } from "../../state/PartyContext";

/** Writing phase: the prompt and how many answers are in (never any text). */
export default function TvWrite() {
  const { state } = useParty();
  const { view, submitted } = state;
  return (
    <>
      <MatchHeader view={view} />
      <PromptCard prompt={view.match.prompt} />
      <p role="status" className="party-hint">
        {submitted.length} of 2 answers in
      </p>
    </>
  );
}
