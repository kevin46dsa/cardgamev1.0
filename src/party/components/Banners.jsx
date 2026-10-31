import React from "react";
import { CONN } from "../config";

/** Dismissible error banner. Announced to screen readers via role="alert". */
export function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;
  return (
    <div className="party-banner party-banner--error" role="alert">
      <span>{error.message}</span>
      <button type="button" className="party-btn party-btn--ghost party-btn--small" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}

/** Connection status: reconnecting notice, or "Try again" after we gave up. */
export function ConnectionBanner({ conn, onRetry }) {
  if (conn === CONN.RECONNECTING) {
    return (
      <div className="party-banner party-banner--info" role="status">
        Connection lost. Reconnecting...
      </div>
    );
  }
  if (conn === CONN.FAILED) {
    return (
      <div className="party-banner party-banner--error" role="alert">
        <span>We could not reconnect.</span>
        <button type="button" className="party-btn party-btn--ghost party-btn--small" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }
  return null;
}

/** TV disconnected notice for phones in TV mode. */
export function TvStatusBanner({ connected }) {
  if (connected !== false) return null;
  return (
    <div className="party-banner party-banner--info" role="status">
      The TV disconnected. The game continues once it reconnects.
    </div>
  );
}
