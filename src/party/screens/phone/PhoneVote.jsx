import React from "react";
import Countdown from "../../components/Countdown";
import PromptCard from "../../components/PromptCard";
import VoteBoard from "../../components/VoteBoard";
import { useParty } from "../../state/PartyContext";
import RoleNotice from "./RoleNotice";

/** Crowd voting. The vote can be changed until the timer ends. */
export default function PhoneVote() {
  const { state, actions } = useParty();
  const { view, myVote } = state;
  return (
    <>
      <div className="party-row" style={{ justifyContent: "space-between" }}>
        <h1 className="party-title" style={{ fontSize: "1.4rem" }}>Which is funnier?</h1>
        <Countdown endsAt={view.endsAt} />
      </div>
      <RoleNotice />
      <PromptCard prompt={view.match.prompt} />
      <VoteBoard sides={view.match.sides} myVote={myVote} onVote={actions.castVote} />
      <p role="status" className="party-hint">
        {myVote ? `Voted ${myVote}. Tap the other one to change.` : "Tap the funnier answer."}
      </p>
    </>
  );
}
