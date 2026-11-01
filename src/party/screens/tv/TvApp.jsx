import React, { useEffect } from "react";
import "../../party.css";
import { PHASE } from "../../config";
import { PartyProvider, useParty } from "../../state/PartyContext";
import TvNotice from "./TvNotice";
import TvPairing from "./TvPairing";
import TvPaused from "./TvPaused";
import TvShell from "./TvShell";
import { STAGE_SCREENS } from "./phaseScreens";
import { canStart } from "../../state/selectors";

/** Keyboard shortcuts from the TV spec: F toggles fullscreen, Enter (remote OK) starts from the lobby. */
function useTvKeys() {
  const { state, actions } = useParty();
  const startable = state.view?.phase === PHASE.LOBBY && canStart(state.view);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) document.exitFullscreen?.();
        else document.documentElement.requestFullscreen?.().catch(() => {});
      } else if (e.key === "Enter" && startable && e.target === document.body) {
        actions.startGame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startable, actions]);
}

/** Picks the TV screen for the current state. */
export function TvRouter() {
  const { state } = useParty();
  useTvKeys();
  const { view } = state;
  let screen;
  if (state.ended) screen = <TvNotice />;
  else if (!view) screen = <TvPairing />;
  else if (view.pausedUntil != null) screen = <TvPaused />;
  else {
    const Stage = STAGE_SCREENS[view.phase];
    screen = Stage ? <Stage /> : null;
  }
  return <TvShell>{screen}</TvShell>;
}

/** Route element for /party/tv. */
export default function TvApp(props) {
  return (
    <PartyProvider kind="tv" {...props}>
      <TvRouter />
    </PartyProvider>
  );
}
