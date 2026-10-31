import React from "react";
import { indexOf, nameOf } from "../state/selectors";
import Avatar from "./Avatar";

/** The crowned winner. */
export default function KingCard({ view }) {
  return (
    <section className="party-king" aria-label="King of the Hill">
      <p className="party-kind">King of the Hill</p>
      <Avatar index={indexOf(view, view.king)} large />
      <p className="party-king__name">{nameOf(view, view.king)}</p>
    </section>
  );
}
