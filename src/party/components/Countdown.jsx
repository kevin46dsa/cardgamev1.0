import React from "react";
import { useCountdown } from "../hooks/useCountdown";

/** Locally rendered countdown to a server deadline. Renders nothing without one. */
export default function Countdown({ endsAt, label = "seconds left" }) {
  const secs = useCountdown(endsAt);
  if (secs == null) return null;
  return (
    <span className="party-timer" role="timer" aria-live="off">
      {secs}
      <span className="party-sr"> {label}</span>
    </span>
  );
}
