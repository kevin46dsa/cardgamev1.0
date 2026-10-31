import { chooseTieBreak as choose } from "@party/shared/src/rules";
import type { Ctx } from "../lib/ctx";
import { fail } from "../lib/fail";
import { mutate } from "../lib/mutate";
import { who } from "../lib/who";
import { settle } from "./settle";

export async function chooseTieBreak(ctx: Ctx, msg: { choice?: unknown }): Promise<void> {
  const w = await who(ctx);
  if (!w) return;
  const id = w.playerId;
  if (!id) return void (await fail(ctx, "NOT_CONTESTANT"));
  const r = await mutate(ctx, w.code, (s) => choose(s, id, msg.choice as "reprompt", ctx.now()));
  if (!r) return;
  await ctx.send(ctx.connectionId, { event: "ack", action: "chooseTieBreak" });
  if (r.earlyEnd) await settle(ctx, w.code); // both chose: move on now
}
