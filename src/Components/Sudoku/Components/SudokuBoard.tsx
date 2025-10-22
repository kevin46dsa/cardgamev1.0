import React, { useState, useCallback } from "react";

export function SudokuBoard(props: { sudokuGameData: any }) {
  const { sudokuGameData } = props;
  console.log(sudokuGameData);
  return (
    <div className="sudoku-board-container">
      <div>Sudoku Board</div>
      <div className="sudoku-board-grid">{sudokuGameData}</div>
    </div>
  );
}

export default SudokuBoard;
