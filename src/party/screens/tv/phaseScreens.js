import { PHASE } from "../../config";
import TvFinal from "./TvFinal";
import TvIntro from "./TvIntro";
import TvLobby from "./TvLobby";
import TvReveal from "./TvReveal";
import TvTiebreak from "./TvTiebreak";
import TvTransition from "./TvTransition";
import TvVote from "./TvVote";
import TvWrite from "./TvWrite";

/** Stage (shared TV view) component for each phase. Phone-only mode reuses these on the phone. */
export const STAGE_SCREENS = {
  [PHASE.LOBBY]: TvLobby,
  [PHASE.INTRO]: TvIntro,
  [PHASE.WRITE]: TvWrite,
  [PHASE.VOTE]: TvVote,
  [PHASE.TIEBREAK]: TvTiebreak,
  [PHASE.REVEAL]: TvReveal,
  [PHASE.TRANSITION]: TvTransition,
  [PHASE.FINAL]: TvFinal,
};
