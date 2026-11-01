import { getTv, listVotes, putVote } from "@party/shared/src/db";
import { crowdIds, isVoteComplete, validateVote } from "@party/shared/src/rules";
import type { Ctx } from "../lib/ctx";
import { fail } from "../lib/fail";
import { readRoom } from "../lib/readRoom";
import { who } from "../lib/who";
import { settle } from "./settle";

// Crowd vote. Voter gets a small `voteAck`; the TV (TV mode only) gets `voteCount`; nobody else hears anything.
export async function castVote(ctx: Ctx, msg: { side?: unknown }): Promise<void> {
  const w = await who(ctx);
  if (!w) return;
  const id = w.playerId;
  if (!id) return void (await fail(ctx, "BAD_REQUEST", "the TV cannot vote"));
  const s = await readRoom(ctx, w.code);
  if (!s) return;
  const v = validateVote(s, id, msg.side as string, ctx.now());
  if ("error" in v) return void (await fail(ctx, v.error));
  const vk = v.vk as unknown as number;
  await putVote(w.code, vk, id, msg.side as "A" | "B");
  await ctx.send(ctx.connectionId, { event: "voteAck", side: msg.side as "A" | "B" });
  const crowd = crowdIds(s);
  const have = (await listVotes(w.code, vk)).filter((x) => crowd.includes(x.voterId)).length;
  if (s.mode === "tv") {
    const tv = await getTv(w.code);
    if (tv?.connectionId) await ctx.send(tv.connectionId, { event: "voteCount", have, need: crowd.length });
  }
  if (isVoteComplete(s, have)) await settle(ctx, w.code);
}
