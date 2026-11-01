import React from "react";
import MatchHeader from "../../components/MatchHeader";
import { useParty } from "../../state/PartyContext";
import { kindLabel } from "../../state/selectors";

/** Match intro: who is playing and what is at stake. */
export default function TvIntro() {
  const { state } = useParty();
  const { view } = state;
  const forFun = Object.values(view.match.stakes).some((s) => !s);
  return (
    <section className="party-center" style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
      <MatchHeader view={view} />
      <p className="party-hint">{kindLabel(view.match.kind)}{forFun ? ": one side is playing for fun" : ""}</p>
    </section>
  );
}
