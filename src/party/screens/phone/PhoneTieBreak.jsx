import React from "react";
import { useParty } from "../../state/PartyContext";
import { opponents, nameOf } from "../../state/selectors";

const CHOICES = [
  { value: "reprompt", label: "New prompt" },
  { value: "revote", label: "Revote" },
];

/** The two tied contestants pick Reprompt or Revote. */
export default function PhoneTieBreak() {
  const { state, actions } = useParty();
  const { view, tieAcked } = state;
  const chosen = view.match.yourChoice;
  const [opponent] = opponents(view);
  return (
    <section className="party-phone__body" style={{ padding: 0 }}>
      <h1 className="party-title">It's a tie with {nameOf(view, opponent)}!</h1>
      <p>Pick what happens next. If you disagree, we revote.</p>
      <div className="party-row" role="group" aria-label="Tie break choice">
        {CHOICES.map(({ value, label }) => (
          <button key={value} type="button" className={`party-btn${chosen === value ? "" : " party-btn--ghost"}`} aria-pressed={chosen === value} disabled={!!chosen} onClick={() => actions.chooseTieBreak(value)}>
            {label}
          </button>
        ))}
      </div>
      <p role="status" className="party-hint">{chosen || tieAcked ? "Choice locked in. Waiting for the other player." : ""}</p>
    </section>
  );
}
