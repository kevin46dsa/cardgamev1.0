import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SudokuBoard } from "./SudokuBoard";

const makeFixture = () => {
  const gameData = Array.from({ length: 9 }, () => Array(9).fill(0));
  const solution = Array.from({ length: 9 }, () => Array(9).fill(5));
  solution[8][8] = 3; // one cell solves to a different digit
  return { gameData, solution };
};

const fillCell = (row: number, col: number, value: number) => {
  fireEvent.click(screen.getByLabelText(`Row ${row + 1} Column ${col + 1}`));
  fireEvent.click(screen.getByRole("button", { name: String(value) }));
};

describe("SudokuBoard", () => {
  it("fills a selected cell with the correct value", () => {
    const { gameData, solution } = makeFixture();
    render(
      <SudokuBoard
        sudokuGameData={gameData}
        sudokuGameSolution={solution}
        sudokuGameDifficulty="easy"
      />
    );

    fillCell(0, 0, 5);

    expect(screen.getByLabelText("Row 1 Column 1")).toHaveTextContent("5");
  });

  it("disables a digit's number-pad button once it has been placed 9 times", () => {
    const { gameData, solution } = makeFixture();
    render(
      <SudokuBoard
        sudokuGameData={gameData}
        sudokuGameSolution={solution}
        sudokuGameDifficulty="easy"
      />
    );

    for (let col = 0; col < 9; col++) {
      fillCell(0, col, 5);
    }

    // Select another blank cell so the number pad isn't disabled wholesale.
    fireEvent.click(screen.getByLabelText("Row 9 Column 9"));

    expect(screen.getByRole("button", { name: "5" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "3" })).not.toBeDisabled();
  });

  it("shows and updates the remaining cell count as cells are filled", () => {
    const { gameData, solution } = makeFixture();
    render(
      <SudokuBoard
        sudokuGameData={gameData}
        sudokuGameSolution={solution}
        sudokuGameDifficulty="easy"
      />
    );

    expect(screen.getByText("81")).toBeInTheDocument();

    fillCell(0, 0, 5);

    expect(screen.getByText("80")).toBeInTheDocument();
  });
});
