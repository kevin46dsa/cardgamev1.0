import React from "react";
import { useParams } from "react-router-dom";
import { GameIDs } from "../../Utils/enums";
import Game from "../Games/Game";
import TruthorDare from "../Truthordare/Truthordare";
import NeverHave from "../NeverHave/NeverHave";
import ChatGPT from "../ChatGPT/ChatGPT";
import Truthordrink from "../Truthordrink/Truthordrink";
import MrWhite from "../MrWhite/MrWhite";
import Sudoku from "../Sudoku/Sudoku";
import WhoIsMostLikely from "../WhoIsMostLikely/WhoIsMostLikely";

const MainPlayer = () => {
  let { id } = useParams();

  return (
    <div style={{ padding: "50px" }}>
      {(() => {
        switch (id) {
          case GameIDs.TruthorDare:
            return <TruthorDare />;
          case GameIDs.Neverhaveiever:
            return <NeverHave />;
          case GameIDs.ChatGPT:
            return <ChatGPT />;
          case GameIDs.sudoku:
            return <Sudoku />;
          case GameIDs.truthordrink:
            return <Truthordrink />;
          case GameIDs.MrWhite:
            return <MrWhite />;
          case GameIDs.WhoIsMostLikely:
            return <WhoIsMostLikely />;
          default:
            return <Game />;
        }
      })()}
    </div>
  );
};

export default MainPlayer;
