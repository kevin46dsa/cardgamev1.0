import React, { useState } from "react";
import { MAX_NAME_LENGTH, PAIR_CODE_LENGTH, ROOM_CODE_LENGTH } from "../../config";
import { useParty } from "../../state/PartyContext";

const MODES = { JOIN: "join", CREATE: "create" };

/**
 * Join a room by code, or create one (optionally paired with a TV code).
 * @param {{initialCode?: string}} props code prefilled from /party/join/:code
 */
export default function EntryScreen({ initialCode = "" }) {
  const { state, actions } = useParty();
  const [mode, setMode] = useState(MODES.JOIN);
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [pair, setPair] = useState("");
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const valid = trimmed.length > 0 && (mode === MODES.CREATE || code.length === ROOM_CODE_LENGTH);

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    if (mode === MODES.JOIN) actions.joinRoom(code, trimmed);
    else actions.createRoom({ name: trimmed, pairCode: pair || undefined });
  };

  return (
    <form onSubmit={submit} className="party-phone__body" style={{ padding: 0 }} noValidate>
      <h1 className="party-title">Funniest Answer</h1>
      <div className="party-row" role="group" aria-label="Join or create">
        <button type="button" className={`party-btn${mode === MODES.JOIN ? "" : " party-btn--ghost"}`} aria-pressed={mode === MODES.JOIN} onClick={() => setMode(MODES.JOIN)}>
          Join a room
        </button>
        <button type="button" className={`party-btn${mode === MODES.CREATE ? "" : " party-btn--ghost"}`} aria-pressed={mode === MODES.CREATE} onClick={() => setMode(MODES.CREATE)}>
          Create a room
        </button>
      </div>
      {mode === MODES.JOIN && (
        <div className="party-field">
          <label htmlFor="party-room">Room code</label>
          <input id="party-room" className="party-input" value={code} maxLength={ROOM_CODE_LENGTH} autoCapitalize="characters" autoComplete="off" onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} />
        </div>
      )}
      <div className="party-field">
        <label htmlFor="party-name">Your name</label>
        <input id="party-name" className="party-input" value={name} maxLength={MAX_NAME_LENGTH} autoComplete="nickname" onChange={(e) => setName(e.target.value)} />
      </div>
      {mode === MODES.CREATE && (
        <div className="party-field">
          <label htmlFor="party-pair">TV code (optional)</label>
          <input id="party-pair" className="party-input" value={pair} inputMode="numeric" maxLength={PAIR_CODE_LENGTH} autoComplete="off" onChange={(e) => setPair(e.target.value.replace(/\D/g, ""))} />
          <span className="party-hint">Leave empty to play on phones only.</span>
        </div>
      )}
      <button type="submit" className="party-btn" disabled={!valid}>
        {mode === MODES.JOIN ? "Join" : "Create room"}
      </button>
    </form>
  );
}
