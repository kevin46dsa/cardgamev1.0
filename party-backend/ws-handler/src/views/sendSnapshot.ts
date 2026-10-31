import { listAnswers, listVotes } from "@party/shared/src/db";
import { nextDeadline, type GameState } from "@party/shared/src/rules";
import type { Ctx } from "../lib/ctx";
import { wireView } from "./wireView";

// `snapshot` for one client: its own view plus its own answer / vote (the only reads a snapshot needs).
export async function sendSnapshot(ctx: Ctx, to: string, code: string, s: GameState, who: string): Promise<void> {
  const m = s.match;
  let ownAnswer: string | undefined;
  let myVote: "A" | "B" | undefined;
  if (m && who !== "tv" && s.phase === "write" && (m.a === who || m.b === who))
    ownAnswer = (await listAnswers(code, m.ak as unknown as number)).find((x) => x.playerId === who)?.text;
  if (m && who !== "tv" && s.phase === "vote") myVote = (await listVotes(code, m.vk as unknown as number)).find((x) => x.voterId === who)?.side;
  await ctx.send(to, { event: "snapshot", view: wireView(s, who, { ownAnswer, myVote }), nextDeadline: nextDeadline(s) });
}
