import React from "react";
import MatchHeader from "../../components/MatchHeader";
import PromptCard from "../../components/PromptCard";
import VoteBoard from "../../components/VoteBoard";
import { useParty } from "../../state/PartyContext";

/** Voting phase: both answers plus the live vote count (TV mode only; the server never sends it otherwise). */
export default function TvVote() {
  const { state } = useParty();
  const { view, voteCount } = state;
  return (
    <>
      <MatchHeader view={view} />
      <PromptCard prompt={view.match.prompt} />
      <VoteBoard sides={view.match.sides} />
      {voteCount && (
        <p role="status" className="party-hint">
          {voteCount.have} of {voteCount.need} votes in
        </p>
      )}
    </>
  );
}
