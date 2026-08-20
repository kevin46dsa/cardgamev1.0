import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGamesList } from "../../hooks/useGamesList";
import { GameIDs, GameTitles } from "../../Utils/enums";
import { s3Url } from "../../Utils/s3";
import Corner3D from "../Decorative/Corner3D";
import "./Home.css";

const SUDOKU_COVER =
  "https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/ChatGPT%20Image%20Oct%2025%2C%202025%2C%2005_26_03%20PM.png?alt=media&token=5202ef72-00f7-42f0-9321-293a71be46ac";



// Games that live in their own top-level Firestore collection (not the
// generic "game" collection Home otherwise lists), so they're added here
// by hand — same reason Sudoku has always been hardcoded below.
const EXTRA_GAMES = [
  {
    ID: GameIDs.sudoku,
    DATA: { name: GameTitles.sudoku, imgUrls: [SUDOKU_COVER] },
  },
  {
    ID: GameIDs.truthordrink,
    DATA: { name: GameTitles.truthordrink, imgUrls: [s3Url("Utility", "cover picture al.png")] },
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { games, loading } = useGamesList();

  const visibleGames = useMemo(() => [...games, ...EXTRA_GAMES], [games]);

  return (
    <div className="home-page">
      <Corner3D corner="top-right" />
      <h1 className="home-title">Pick A Game</h1>
      <div className="home-grid">
        {!loading &&
          visibleGames.map((game, index) => (
            <button
              key={game.ID}
              className="home-card pressable"
              style={{ "--i": index }}
              onClick={() => navigate(`/${game.ID}`)}
            >
              <img className="home-card-img" alt="Game Cover" src={game.DATA.imgUrls[0]} />
              <div className="home-card-body">Let's play {game.DATA.name}!!</div>
            </button>
          ))}
      </div>
    </div>
  );
};

export default Home;
