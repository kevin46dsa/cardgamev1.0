import { removePlayer } from "@party/shared/src/rules";
import type { Ctx } from "../lib/ctx";
import { fail } from "../lib/fail";
import { mutate } from "../lib/mutate";
import { who } from "../lib/who";
import { announce } from "../views/announce";

export async function leaveRoom(ctx: Ctx): Promise<void> {
  const w = await who(ctx);
  if (!w) return;
  const id = w.playerId;
  if (!id) return void (await fail(ctx, "BAD_REQUEST", "only players can leave"));
  const r = await mutate(ctx, w.code, (s) => removePlayer(s, id, ctx.now(), ctx.rng));
  if (!r) return;
  await ctx.send(ctx.connectionId, { event: "left" });
  await announce(ctx, w.code, r.state, r.events, { subject: id, skip: [ctx.connectionId] });
}
