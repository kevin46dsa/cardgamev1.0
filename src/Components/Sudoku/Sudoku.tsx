import React, { useState, useCallback } from "react";
import { SudokuGameMenu, SudokuBoard } from "./Components";

import { GameTitles } from "../../Utils/enums";

function Sudoku() {
  const [sudokuGameData, setSudokuGameData] = useState<any>(null);
  const fetchSudokuGameData = useCallback(async (difficulty = "easy") => {
    fetch("https://youdosudoku.com/api/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        difficulty, // "easy", "medium", or "hard" (defaults to "easy")
        solution: true, // true or false (defaults to true)
        array: false,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setSudokuGameData(data);
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
      <h1>{GameTitles.sudoku}</h1>
      <br />
      <br />
      {!sudokuGameData && (
        <SudokuGameMenu getSudokuGameData={fetchSudokuGameData} />
      )}
      {sudokuGameData && <SudokuBoard sudokuGameData={sudokuGameData} />}
    </div>
  );
}

export default Sudoku;
