export interface SudokuBoardProps {
  sudokuGameData: number[][]; // 9x9 grid; use 0 for blanks
  sudokuGameSolution: number[][] | null; // 9x9 or null
  sudokuGameDifficulty: string | null; // "easy" | "medium" | "hard" | null
}

export type Cell = {
  value: number | null;
  row: number;
  col: number;
  cellColor: string;
  textColor?: string;
  isSelected: boolean;
  isGiven: boolean; // NEW: prefilled cell
};
