import React from "react";
import { useParty } from "../../state/PartyContext";
import { roleNotice } from "../../state/selectors";

/** Explains bye / sits-out / Valley / fate decider / Last Chance when it applies to this player. */
export default function RoleNotice() {
  const { state } = useParty();
  const notice = roleNotice(state.view);
  if (!notice) return null;
  return (
    <section className="party-card" aria-label="Your role">
      <h2 className="party-title" style={{ fontSize: "1.3rem" }}>{notice.title}</h2>
      <p>{notice.body}</p>
    </section>
  );
}
