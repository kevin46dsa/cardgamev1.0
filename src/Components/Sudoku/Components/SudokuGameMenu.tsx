import { Button } from "react-bootstrap";

export function SudokuGameMenu(props: { getSudokuGameData: any }) {
  const { getSudokuGameData } = props;

  const handleDifficultyChange = (difficulty: string) => {
    getSudokuGameData(difficulty);
  };

  return (
    <div className="sudoku-game-menu-container">
      <div>Sudoku Game Menu</div>
      <Button onClick={() => handleDifficultyChange("easy")}>Easy</Button>
      <Button onClick={() => handleDifficultyChange("medium")}>Medium</Button>
      <Button onClick={() => handleDifficultyChange("hard")}>Hard</Button>
    </div>
  );
}
