import React, { useState, useCallback } from "react";
import { SudokuGameMenu, SudokuBoard } from "./Components";

import { GameTitles } from "../../Utils/enums";

function Sudoku() {
  const [sudokuGameData, setSudokuGameData] = useState<number[][] | null>(null);
  const [sudokuGameSolution, setSudokuGameSolution] = useState<
    number[][] | null
  >(null);
  const [sudokuGameDifficulty, setSudokuGameDifficulty] = useState<
    string | null
  >(null);
  const fetchSudokuGameData = useCallback(async () => {
    fetch(
      "https://sudoku-api.vercel.app/api/dosuku?query={newboard(limit:1){grids{value,solution,difficulty},results,message}}",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        setSudokuGameData(data.newboard.grids[0].value);
        setSudokuGameSolution(data.newboard.grids[0].solution);
        setSudokuGameDifficulty(data.newboard.grids[0].difficulty);
      })
      .catch((error) => {
        console.error("Error fetching Sudoku game data:", error);
      });
  }, []);

  return (
    <div className="sudoku-container">
      <br />
      <br />
      <br />
      <SudokuGameMenu getSudokuGameData={fetchSudokuGameData} />

      {sudokuGameData && (
        <SudokuBoard
          sudokuGameData={sudokuGameData}
          sudokuGameSolution={sudokuGameSolution}
          sudokuGameDifficulty={sudokuGameDifficulty}
        />
      )}
    </div>
  );
}

export default Sudoku;
