import { Button } from "react-bootstrap";

export function SudokuGameMenu(props: { getSudokuGameData: any }) {
  const { getSudokuGameData } = props;

  const handleDifficultyChange = () => {
    getSudokuGameData();
  };

  return (
    <div className="sudoku-game-menu-container">
      <div>Sudoku Game Menu</div>
      <Button onClick={() => handleDifficultyChange()}>Generate Board</Button>
    </div>
  );
}
