import type { GameState } from "./types";
import { crowdIds } from "./util";

// voteCount = votes stored under the current `vk`. Approximate hint (a vote from someone who has since left still
// counts here); advance recomputes exactly from the votes map. Also used for the TV "6 of 8" count: need = crowd size.
export const isVoteComplete = (state: GameState, voteCount: number): boolean => {
  const need = crowdIds(state).length;
  return state.phase === "vote" && need > 0 && voteCount >= need;
};
