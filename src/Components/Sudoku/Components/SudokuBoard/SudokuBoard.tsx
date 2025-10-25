import React from "react";
import { SudokuBoardProps } from "./SudokuBoardTypes";
import { useSudokuBoard } from "./useSudokuBoard";
import "./SudokuBoardStyles.css";

export function SudokuBoard(props: SudokuBoardProps) {
  const {
    sudokuGameSolution,
    sudokuGameDifficulty,
    SudokuBoardMain,
    remainingCells,
    showSolution,
    handleShowSolution,
    GameOverScreen,
  } = useSudokuBoard(props);

  return (
    <div className="sudoku-board-container">
      <h2>Sudoku Board</h2>
      <div className="meta">
        {!GameOverScreen && (
          <>
            <div>
              <strong>Difficulty:</strong> {sudokuGameDifficulty ?? "—"}
            </div>

            <div> Remaining Cells: {remainingCells}</div>
            {SudokuBoardMain}
            <button onClick={handleShowSolution}>
              {showSolution ? "Hide Solution" : "Show Solution"}
            </button>
            {showSolution && (
              <>
                <div className="solution">
                  <strong>Solution:</strong>{" "}
                  {Array.isArray(sudokuGameSolution)
                    ? JSON.stringify(sudokuGameSolution)
                    : "—"}
                </div>
              </>
            )}
          </>
        )}
      </div>
      {GameOverScreen}
    </div>
  );
}

export default SudokuBoard;
