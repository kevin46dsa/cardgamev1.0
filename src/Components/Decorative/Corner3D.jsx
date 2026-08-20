import React from "react";
import "./Corner3D.css";

/**
 * Seed pattern for future 3D decorative elements: a spinning two-sided card
 * icon built from plain CSS (perspective + preserve-3d + backface-visibility)
 * — the same technique used for the card-flip animation. Purely decorative.
 */
const Corner3D = ({ corner = "top-right", size = 64, speed = "6s" }) => (
  <div
    className={`corner3d corner3d--${corner}`}
    style={{ "--corner3d-size": `${size}px`, "--corner3d-speed": speed }}
    aria-hidden="true"
  >
    <div className="corner3d-spinner">
      <span className="corner3d-face corner3d-face--front">♠</span>
      <span className="corner3d-face corner3d-face--back">♥</span>
    </div>
  </div>
);

export default Corner3D;
