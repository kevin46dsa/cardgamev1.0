import { useCallback, useEffect, useMemo, useState } from "react";
import { SudokuBoardProps, Cell } from "./SudokuBoardTypes";
/**
 * State and Handlers
 * #1 Initial state to populate the board with values
 * #2 when i select a cell, i pick a number to fill in
 *    - a. if it is correct, update the board state and ensure that cell is no longer selectable
 *   - b. if it is incorrect, maybe show a message or highlight the cell in red - options should have a undo button that basically just reset the selected value
 *
 * #3 counter on the number of null cells remaining if non then game over / you win
 *
 */
export const useSudokuBoard = (props: SudokuBoardProps) => {
  const { sudokuGameData, sudokuGameSolution, sudokuGameDifficulty } = props;

  const [gameData, setGameData] = useState<Cell[][]>([[]]);
  const [potentialOption, setPotentialOption] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  // Initialize game data with cell metadata
  const populateCellData = useCallback((): Cell[][] => {
    return sudokuGameData.map((row, rowIndex) =>
      row.map((value, colIndex) => ({
        value: value === 0 ? null : value,
        row: rowIndex,
        col: colIndex,
        cellColor: value === 0 ? "white" : "lightgray",
        textColor: value === 0 ? "black" : "blue",
        isSelected:
          selectedCell?.row === rowIndex && selectedCell?.col === colIndex,
      }))
    );
  }, [sudokuGameData]);

  const handleShowSolution = useCallback(() => {
    setShowSolution((prev) => !prev);
  }, [setShowSolution]);

  // Populate initial game data when sudokuGameData prop changes
  useEffect(() => {
    setGameData(populateCellData());
  }, [sudokuGameData]);

  // Count of remaining empty cells
  const remainingCells = useMemo(() => {
    return gameData.flat().filter((cell) => cell.value === null).length;
  }, [gameData]);

  const updatedGameData = useMemo(() => {
    return gameData.map((row) => row.slice());
  }, [gameData]);

  /*
  Manages Cell selection and color updates on click 
  if selected, change color to lightblue
  if the selected cell is a pre-filled cell, do not allow selection
  */
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      // Update selected cell
      // Update the color of the cell
      setGameData((prevGameData) => {
        return prevGameData.map((r, rIndex) =>
          r.map((cell, cIndex) => {
            if (rIndex === row && cIndex === col) {
              return {
                ...cell,
                isSelected: true,
                cellColor: "lightblue",
              };
            }
            return {
              ...cell,
              isSelected: false,
              cellColor: cell.value === null ? "white" : "lightgray",
            };
          })
        );
      });
      setSelectedCell({ row, col });
    },
    [gameData, setGameData, setSelectedCell]
  );

  /*
  Handles option selection to fill in the selected cell
  If the selected option matches the solution, update the cell value and color to green
  If not, highlight the cell in red temporarily
  */
  const handleOnOptionSelect = useCallback(
    (num: number) => {
      if (selectedCell) {
        const { row, col } = selectedCell;
        const correctValue = sudokuGameSolution && sudokuGameSolution[row][col];

        if (num === correctValue) {
          // Correct selection
          updatedGameData[row][col] = {
            ...updatedGameData[row][col],
            value: num,
            cellColor: "lightgreen",
            isSelected: false,
          };
          setGameData(updatedGameData);
        } else {
          // Incorrect selection - highlight in red temporarily
          updatedGameData[row][col] = {
            ...updatedGameData[row][col],
            cellColor: "lightcoral",
            isSelected: false,
            value: num,
          };
          setGameData(updatedGameData);
          // Revert back to original color after a short delay
          setTimeout(() => {
            setGameData((prevGameData) =>
              prevGameData.map((r, rIndex) =>
                r.map((cell, cIndex) => {
                  if (rIndex === row && cIndex === col) {
                    return {
                      ...cell,
                      cellColor: "white",
                      value: null,
                    };
                  }
                  return cell;
                })
              )
            );
          }, 500);
        }
        // Clear selected cell
        setSelectedCell(null);
        setPotentialOption(null);
      }
    },
    [
      selectedCell,
      sudokuGameData,
      potentialOption,
      updatedGameData,
      sudokuGameSolution,
      setGameData,
      setSelectedCell,
      setPotentialOption,
    ]
  );

  const options = useMemo(() => {
    // Example options; you can expand this as needed
    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
  }, []);

  const GameOverScreen = useMemo(() => {
    if (remainingCells === 0) {
      setGameData([[]]);
      setSelectedCell(null);
      setPotentialOption(null);
      return (
        <div className="game-over-screen">
          <h2>Game Over!</h2>
          <p>Congratulations! You've completed this Puzzle.</p>
          <p>Click Generate Board to play again.</p>
        </div>
      );
    }
    return null;
  }, [remainingCells]);

  // A ready-to-render board element. (You could also return data + let the component render it.)
  const SudokuBoardMain = (
    <>
      <div className="sudoku-board-main">
        {gameData.flat().map((cell) => (
          <button
            style={{ backgroundColor: cell.cellColor }}
            key={`${cell.row}-${cell.col}`}
            className={`sudoku-cell ${cell.isSelected ? "selected" : ""}`}
            onClick={() => handleCellClick(cell.row, cell.col)}
            type="button"
          >
            <span style={{ color: cell.textColor }}>{cell.value ?? ""}</span>
          </button>
        ))}
      </div>
      <div>
        {selectedCell ? "Choose a number to fill in:" : "Select a cell"}
      </div>
      <div className="sudoku-board-options">
        {options.map((num) => (
          <button
            disabled={selectedCell === null}
            key={num}
            type="button"
            className="sudoku-option-button"
            onClick={() => handleOnOptionSelect(num)}
          >
            {num}
          </button>
        ))}
      </div>
    </>
  );

  return {
    sudokuGameData,
    sudokuGameSolution,
    sudokuGameDifficulty,
    SudokuBoardMain,
    remainingCells,
    showSolution,
    handleShowSolution,
    GameOverScreen,
  };
};
