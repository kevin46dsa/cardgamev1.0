import React from "react";
import PlayerCards from "./PlayerCards";
import NoOfPlayers from "./NoOfPlayers";
import { useMrWhite } from "../useMrWhite";

const Handler = () => {
  const { gameData, createGame, resetGame, startGame, startFunc } =
    useMrWhite();

  console.log(gameData);
  return (
    <>
      <button onClick={startFunc}>Create Game</button>
      <button onClick={() => resetGame}>Reset Game</button>
      {gameData && (
        <>
          {!startGame && gameData.players.length !== 0 && (
            <>
              <h1>Active Round: {gameData.activeRound}</h1>

              <PlayerCards />
            </>
          )}
          {/* Modal to prompt at start game */}
          <NoOfPlayers show={startGame} createGameFunc={createGame} />
        </>
      )}
    </>
  );
};

export default Handler;
