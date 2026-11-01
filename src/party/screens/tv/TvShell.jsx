import React from "react";
import { ConnectionBanner, ErrorBanner } from "../../components/Banners";
import PhaseAnnouncer from "../../components/PhaseAnnouncer";
import { useWakeLock } from "../../hooks/useWakeLock";
import { useParty } from "../../state/PartyContext";

/** Full-screen TV frame: status banners, phase announcer, wake lock. */
export default function TvShell({ children }) {
  const { state, actions } = useParty();
  useWakeLock(true);
  return (
    <main className="party party-tv">
      <PhaseAnnouncer phase={state.view?.phase} />
      <ConnectionBanner conn={state.conn} onRetry={actions.retry} />
      <ErrorBanner error={state.error} onDismiss={actions.dismissError} />
      {children}
    </main>
  );
}
