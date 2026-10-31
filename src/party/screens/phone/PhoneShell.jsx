import React from "react";
import { ConnectionBanner, ErrorBanner, TvStatusBanner } from "../../components/Banners";
import PhaseAnnouncer from "../../components/PhaseAnnouncer";
import { useWakeLock } from "../../hooks/useWakeLock";
import { useParty } from "../../state/PartyContext";

/** Phone frame: status banners, phase announcer, wake lock while in a room. */
export default function PhoneShell({ children }) {
  const { state, actions } = useParty();
  const { view } = state;
  useWakeLock(!!view);
  return (
    <main className="party">
      <PhaseAnnouncer phase={view?.phase} />
      <ConnectionBanner conn={state.conn} onRetry={actions.retry} />
      <TvStatusBanner connected={view?.mode === "tv" ? state.tvConnected : null} />
      <ErrorBanner error={state.error} onDismiss={actions.dismissError} />
      <div className="party-phone">
        <div className="party-phone__body">{children}</div>
      </div>
    </main>
  );
}
