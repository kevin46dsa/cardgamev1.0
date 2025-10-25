import { Button } from "react-bootstrap";
import "./SudokuGameMenuStyles.css";

export function SudokuGameMenu(props: { getSudokuGameData: any }) {
  const { getSudokuGameData } = props;

  const handleDifficultyChange = () => {
    getSudokuGameData();
  };

  return (
    <div className="sudoku-game-menu-container">
      <h2>🧩 Sudoku</h2>
      <Button onClick={() => handleDifficultyChange()}>Generate Board</Button>
    </div>
  );
}
