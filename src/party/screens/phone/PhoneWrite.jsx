import React, { useState } from "react";
import Countdown from "../../components/Countdown";
import PromptCard from "../../components/PromptCard";
import { MAX_ANSWER_LENGTH } from "../../config";
import { useParty } from "../../state/PartyContext";
import RoleNotice from "./RoleNotice";

/** Contestant answer entry. Can be re-sent until time runs out; the server keeps the latest. */
export default function PhoneWrite() {
  const { state, actions } = useParty();
  const { view } = state;
  const [text, setText] = useState(view.match.yourAnswer ?? "");
  const [sent, setSent] = useState(view.match.yourAnswer ?? null);
  const trimmed = text.trim();
  const locked = sent !== null && sent === trimmed;

  const submit = (e) => {
    e.preventDefault();
    if (!trimmed) return;
    actions.submitAnswer(trimmed);
    setSent(trimmed);
  };

  return (
    <form onSubmit={submit} className="party-phone__body" style={{ padding: 0 }}>
      <div className="party-row" style={{ justifyContent: "space-between" }}>
        <h1 className="party-title" style={{ fontSize: "1.3rem" }}>Your answer</h1>
        <Countdown endsAt={view.endsAt} />
      </div>
      <RoleNotice />
      <PromptCard prompt={view.match.prompt} />
      <div className="party-field">
        <label htmlFor="party-answer">Type something funny</label>
        <textarea id="party-answer" className="party-input" value={text} maxLength={MAX_ANSWER_LENGTH} onChange={(e) => setText(e.target.value)} />
        <span className="party-hint">{text.length} / {MAX_ANSWER_LENGTH}</span>
      </div>
      <button type="submit" className="party-btn" disabled={!trimmed || locked}>
        {sent === null ? "Submit" : locked ? "Answer locked in" : "Update answer"}
      </button>
      <p role="status" className="party-hint">
        {sent === null ? "" : "Your answer is in. You can change it until time is up."}
      </p>
    </form>
  );
}
