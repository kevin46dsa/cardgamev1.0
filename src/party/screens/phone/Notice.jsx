import React from "react";

/** Centered full-screen message with one optional action (kicked, ended, left, loading). */
export default function Notice({ title, body, actionLabel, onAction }) {
  return (
    <section className="party-center" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h1 className="party-title">{title}</h1>
      {body && <p>{body}</p>}
      {actionLabel && (
        <button type="button" className="party-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  );
}
