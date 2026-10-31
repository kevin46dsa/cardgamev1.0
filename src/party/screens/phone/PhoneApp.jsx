import React from "react";
import { useParams } from "react-router-dom";
import "../../party.css";
import { PHASE } from "../../config";
import { PartyProvider, useParty } from "../../state/PartyContext";
import { isContestant } from "../../state/selectors";
import EntryScreen from "./EntryScreen";
import Notice from "./Notice";
import PhoneFinal from "./PhoneFinal";
import PhoneIntro from "./PhoneIntro";
import PhoneLobby from "./PhoneLobby";
import PhonePaused from "./PhonePaused";
import PhoneReveal from "./PhoneReveal";
import PhoneShell from "./PhoneShell";
import PhoneTieBreak from "./PhoneTieBreak";
import PhoneTransition from "./PhoneTransition";
import PhoneVote from "./PhoneVote";
import PhoneWatching from "./PhoneWatching";
import PhoneWrite from "./PhoneWrite";
import WelcomeBack from "./WelcomeBack";

/** Phase -> screen. `mine` / `other` split on whether this player is one of the two contestants. */
function PhaseScreen({ view }) {
  const mine = isContestant(view);
  switch (view.phase) {
    case PHASE.LOBBY: return <PhoneLobby />;
    case PHASE.INTRO: return <PhoneIntro />;
    case PHASE.WRITE: return mine ? <PhoneWrite /> : <PhoneWatching />;
    case PHASE.VOTE: return mine ? <PhoneWatching /> : <PhoneVote />;
    case PHASE.TIEBREAK: return mine ? <PhoneTieBreak /> : <PhoneWatching />;
    case PHASE.REVEAL: return <PhoneReveal />;
    case PHASE.TRANSITION: return <PhoneTransition />;
    case PHASE.FINAL: return <PhoneFinal />;
    default: return null;
  }
}

/** Picks the phone screen for the current state. */
export function PhoneRouter({ initialCode }) {
  const { state, actions } = useParty();
  const { view } = state;
  let screen;
  if (state.kicked) screen = <Notice title="You were removed" body="The host removed you from this room." actionLabel="Back to start" onAction={actions.reset} />;
  else if (state.ended) screen = <Notice title="Game ended" body="The host ended this game." actionLabel="Back to start" onAction={actions.reset} />;
  else if (state.left) screen = <Notice title="You left the game" body="You can rejoin with the room code before the finale." actionLabel="Back to start" onAction={actions.reset} />;
  else if (!view && !state.session) screen = <EntryScreen initialCode={initialCode} />;
  else if (!view) screen = <Notice title="Connecting..." body="Getting your seat back." />;
  else if (state.welcomeBack) screen = <WelcomeBack />;
  else if (view.pausedUntil != null) screen = <PhonePaused />;
  else screen = <PhaseScreen view={view} />;
  return <PhoneShell>{screen}</PhoneShell>;
}

/** Route element for /party and /party/join/:code. */
export default function PhoneApp(props) {
  const { code } = useParams();
  return (
    <PartyProvider kind="phone" {...props}>
      <PhoneRouter initialCode={code ?? ""} />
    </PartyProvider>
  );
}
