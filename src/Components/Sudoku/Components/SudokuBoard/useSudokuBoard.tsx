import { useCallback, useEffect, useMemo, useState } from "react";
import { SudokuBoardProps, Cell } from "./SudokuBoardTypes";

export const useSudokuBoard = (props: SudokuBoardProps) => {
  const { sudokuGameData, sudokuGameSolution, sudokuGameDifficulty } = props;

  const [gameData, setGameData] = useState<Cell[][]>([[]]);
  const [potentialOption, setPotentialOption] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  // Build cells with metadata
  const populateCellData = useCallback((): Cell[][] => {
    return sudokuGameData.map((row, rowIndex) =>
      row.map((value, colIndex) => {
        const isGiven = value !== 0 && value !== null;
        return {
          value: value === 0 ? null : value,
          row: rowIndex,
          col: colIndex,
          cellColor: isGiven ? "#eef2ff" : "#ffffff", // matches CSS defaults
          textColor: isGiven ? "#3730a3" : "#111827",
          isSelected: false,
          isGiven,
        };
      })
    );
  }, [sudokuGameData]);

  const handleShowSolution = useCallback(() => setShowSolution((p) => !p), []);

  useEffect(() => {
    setGameData(populateCellData());
    setSelectedCell(null);
  }, [populateCellData]);

  const remainingCells = useMemo(
    () => gameData.flat().filter((cell) => cell.value === null).length,
    [gameData]
  );

  const updatedGameData = useMemo(
    () => gameData.map((row) => row.slice()),
    [gameData]
  );

  // Select a cell (skip givens)
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      const cell = gameData[row]?.[col];
      if (!cell || cell.isGiven) return; // not selectable

      setGameData((prev) =>
        prev.map((r, rIndex) =>
          r.map((c, cIndex) => {
            if (rIndex === row && cIndex === col) {
              return { ...c, isSelected: true, cellColor: "#ecfdf5" }; // green-50
            }
            const bg = c.isGiven ? "#eef2ff" : "#ffffff";
            return { ...c, isSelected: false, cellColor: bg };
          })
        )
      );
      setSelectedCell({ row, col });
    },
    [gameData]
  );

  // Fill selected cell with a number, compare to solution
  const handleOnOptionSelect = useCallback(
    (num: number) => {
      if (!selectedCell) return;
      const { row, col } = selectedCell;
      const correctValue = sudokuGameSolution?.[row]?.[col];

      if (num === correctValue) {
        // Correct
        updatedGameData[row][col] = {
          ...updatedGameData[row][col],
          value: num,
          cellColor: "#d1fae5", // green-100
          isSelected: false,
        };
        setGameData(updatedGameData);
      } else {
        // Incorrect: flash red then revert
        updatedGameData[row][col] = {
          ...updatedGameData[row][col],
          cellColor: "#fecaca", // red-200
          isSelected: false,
          value: num,
        };
        setGameData(updatedGameData);
        setTimeout(() => {
          setGameData((prev) =>
            prev.map((r, ri) =>
              r.map((c, ci) =>
                ri === row && ci === col
                  ? { ...c, cellColor: "#ffffff", value: null }
                  : c
              )
            )
          );
        }, 500);
      }

      setSelectedCell(null);
      setPotentialOption(null);
    },
    [selectedCell, sudokuGameSolution, updatedGameData]
  );

  const options = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9], []);

  // Helpful classes for 3×3 borders & alternating box tint
  const getBoxClasses = (row: number, col: number) => {
    const classes = [];
    if (col === 0) classes.push("box-left");
    if (row === 0) classes.push("box-top");
    if (col % 3 === 2) classes.push("box-right");
    if (row % 3 === 2) classes.push("box-bottom");
    if ((Math.floor(row / 3) + Math.floor(col / 3)) % 2 === 1)
      classes.push("box-alt");
    return classes.join(" ");
  };

  const GameOverScreen = useMemo(() => {
    if (remainingCells === 0) {
      return (
        <div className="game-over-screen">
          <h2>🎉 You did it!</h2>
          <p>Awesome job finishing the puzzle.</p>
          <p>Tap “Generate Board” to play again.</p>
        </div>
      );
    }
    return null;
  }, [remainingCells]);

  const SudokuBoardMain = (
    <>
      <div className="sudoku-board-main" role="grid" aria-label="Sudoku Board">
        {gameData.flat().map((cell) => {
          const boundaryClasses = getBoxClasses(cell.row, cell.col);
          const givenClass = cell.isGiven
            ? "given"
            : cell.value
            ? "filled"
            : "";
          return (
            <button
              key={`${cell.row}-${cell.col}`}
              type="button"
              className={`sudoku-cell ${boundaryClasses} ${givenClass} ${
                cell.isSelected ? "selected" : ""
              }`}
              style={{ backgroundColor: cell.cellColor, color: cell.textColor }}
              onClick={() => handleCellClick(cell.row, cell.col)}
              aria-pressed={cell.isSelected}
              aria-label={`Row ${cell.row + 1} Column ${cell.col + 1}`}
            >
              {cell.value ?? ""}
            </button>
          );
        })}
      </div>

      <div className="sudoku-board-instructions">
        {selectedCell
          ? "Pick a number to place it!"
          : "Tap a cell to select it."}
      </div>

      <div className="sudoku-board-options" aria-label="Number pad">
        {options.map((num) => (
          <button
            key={num}
            type="button"
            className="sudoku-option-button"
            disabled={selectedCell === null}
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
