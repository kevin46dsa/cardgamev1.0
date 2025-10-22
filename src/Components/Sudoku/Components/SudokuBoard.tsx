import React, { useState, useCallback } from "react";

interface SudokuBoardProps {
  sudokuGameData: any;
  sudokuGameSolution: any;
  sudokuGameDifficulty: any;
}

export function SudokuBoard(props: SudokuBoardProps) {
  const { sudokuGameData, sudokuGameSolution, sudokuGameDifficulty } = props;
  return (
    <div className="sudoku-board-container">
      <div>Sudoku Board</div>
      <div>Difficulty: {sudokuGameDifficulty}</div>
      <div>Solution: {sudokuGameSolution}</div>
      <div className="sudoku-board-grid">{sudokuGameData}</div>
    </div>
  );
}

export default SudokuBoard;
