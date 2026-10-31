import React from "react";
import { avatarColor } from "./avatarColors";

/** Decorative coloured dot for a player (the name always sits beside it). */
export default function Avatar({ index, large = false }) {
  return <span aria-hidden="true" className={`party-avatar${large ? " party-avatar--lg" : ""}`} style={{ background: avatarColor(index) }} />;
}
