import React, { useState, useCallback } from "react";
import { SudokuGameMenu, SudokuBoard } from "./Components";

import { GameTitles } from "../../Utils/enums";

function Sudoku() {
  const [sudokuGameData, setSudokuGameData] = useState<any>(null);
  const fetchSudokuGameData = useCallback(async (difficulty = "easy") => {
    try {
      const res = await fetch("/sudoku-api/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty, // "easy" | "medium" | "hard"
          solution: true,
          array: false,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSudokuGameData(data);
    } catch (err) {
      console.error("Error fetching Sudoku game data:", err);
    }
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
