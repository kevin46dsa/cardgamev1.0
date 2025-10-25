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
      <div className="meta">
        {!GameOverScreen && (
          <>
            <div>
              <strong>Difficulty:</strong> {sudokuGameDifficulty ?? "—"}
            </div>
            <div>
              <strong>Remaining Cells:</strong> {remainingCells}
            </div>

            {SudokuBoardMain}

            <div className="sudoku-utility-bar">
              <button
                className="sudoku-utility-button"
                onClick={handleShowSolution}
              >
                {showSolution ? "Hide Solution" : "Show Solution"}
              </button>
            </div>

            {showSolution && (
              <div
                className="solution"
                style={{ fontSize: ".9rem", overflowWrap: "anywhere" }}
              >
                <strong>Solution:</strong>{" "}
                {Array.isArray(sudokuGameSolution)
                  ? JSON.stringify(sudokuGameSolution)
                  : "—"}
              </div>
            )}
          </>
        )}
      </div>

      {GameOverScreen}
    </div>
  );
}

export default SudokuBoard;
