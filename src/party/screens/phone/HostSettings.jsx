import React from "react";
import { ROUNDS_OPTIONS, VOTE_SECS_RANGE, WRITE_SECS_RANGE } from "../../config";

function Range({ id, label, range, value, onChange }) {
  return (
    <div className="party-field">
      <label htmlFor={id}>{label}: {value}s</label>
      <input id={id} type="range" min={range.min} max={range.max} step={range.step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/**
 * Host-only lobby settings. Each change is sent as a single updateSettings.
 * @param {{settings: object, onChange: (patch: object) => void}} props
 */
export default function HostSettings({ settings, onChange }) {
  return (
    <fieldset className="party-card" style={{ border: 0 }}>
      <legend className="party-title" style={{ fontSize: "1.2rem" }}>Settings</legend>
      <Range id="party-write" label="Writing time" range={WRITE_SECS_RANGE} value={settings.writeSecs} onChange={(writeSecs) => onChange({ writeSecs })} />
      <Range id="party-vote" label="Voting time" range={VOTE_SECS_RANGE} value={settings.voteSecs} onChange={(voteSecs) => onChange({ voteSecs })} />
      <div className="party-field">
        <label htmlFor="party-rounds">Rounds</label>
        <select id="party-rounds" className="party-input" value={settings.rounds} onChange={(e) => onChange({ rounds: Number(e.target.value) })}>
          {ROUNDS_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="party-field">
        <label htmlFor="party-odd">Odd player starts in</label>
        <select id="party-odd" className="party-input" value={settings.oddPlayerStart} onChange={(e) => onChange({ oddPlayerStart: e.target.value })}>
          <option value="champion">Champion Hill</option>
          <option value="comeback">Comeback Hill</option>
        </select>
      </div>
      <label className="party-row" style={{ minHeight: "var(--p-tap)" }}>
        <input type="checkbox" checked={settings.profanity} onChange={(e) => onChange({ profanity: e.target.checked })} style={{ width: 24, height: 24 }} />
        Filter bad language
      </label>
    </fieldset>
  );
}
