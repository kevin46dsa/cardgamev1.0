export interface SudokuBoardProps {
  sudokuGameData: number[][]; // 9x9 grid of numbers (use 0 or null for blanks)
  sudokuGameSolution: number[][] | null; // 9x9 or null
  sudokuGameDifficulty: string | null; // e.g., "easy" | "medium" | "hard" | null
}

export type Cell = {
  value: number | null;
  row: number;
  col: number;
  cellColor: string;
  textColor?: string;
  isSelected: boolean;
};
