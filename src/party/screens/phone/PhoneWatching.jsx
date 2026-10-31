import React from "react";
import Countdown from "../../components/Countdown";
import PromptCard from "../../components/PromptCard";
import { PHASE } from "../../config";
import { useParty } from "../../state/PartyContext";
import TvTiebreak from "../tv/TvTiebreak";
import TvVote from "../tv/TvVote";
import TvWrite from "../tv/TvWrite";
import RoleNotice from "./RoleNotice";
import StageOrNote from "./StageOrNote";

const COPY = {
  [PHASE.WRITE]: { title: "Players are writing", body: "Answers appear when time is up." },
  [PHASE.VOTE]: { title: "The crowd is voting", body: "Sit tight while they pick the funnier answer." },
  [PHASE.TIEBREAK]: { title: "It's a tie", body: "The two players are choosing what happens next." },
};
const STAGES = { [PHASE.WRITE]: TvWrite, [PHASE.VOTE]: TvVote, [PHASE.TIEBREAK]: TvTiebreak };

/** Static "waiting" screen: never shows typing, only the server's submitted events. */
export default function PhoneWatching() {
  const { state } = useParty();
  const { view } = state;
  const copy = COPY[view.phase];
  const note = (
    <>
      <h1 className="party-title">{copy.title}</h1>
      <PromptCard prompt={view.match.prompt} />
      <p role="status">{copy.body}</p>
      <Countdown endsAt={view.endsAt} />
    </>
  );
  return (
    <>
      <RoleNotice />
      <StageOrNote stage={STAGES[view.phase]} note={note} />
    </>
  );
}
