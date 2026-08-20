import React from "react";
import CardDesign from "../CardDesigns/CardDesign";
import "./FlashCardGame.css";

/**
 * Shared shell for "draw a random prompt" games (Truth or Dare,
 * Never Have I Ever, Who's Most Likely To...). Previously each game
 * copy-pasted this layout plus an identical <style> block.
 */
const FlashCardGame = ({ title, cardTitle, message, buttons = [], ready }) => {
  return (
    <div className="flash-card-game">
      <br />
      <br />
      <br />
      <h1>{title}</h1>
      <br />
      <br />
      {message && <CardDesign message={message} title={cardTitle ?? title} />}
      {ready && buttons.length > 0 && (
        <div className="button-container">
          {buttons.map(({ label, onClick }) => (
            <button key={label} onClick={onClick}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashCardGame;
