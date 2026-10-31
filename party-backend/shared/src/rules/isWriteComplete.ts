import type { GameState } from "./types";

// answerCount = answers stored under the current `ak`. True = call advance now (early end).
export const isWriteComplete = (state: GameState, answerCount: number): boolean => state.phase === "write" && answerCount >= 2;
