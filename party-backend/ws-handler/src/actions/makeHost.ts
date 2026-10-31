import { makeHost as hand } from "@party/shared/src/rules";
import type { Ctx } from "../lib/ctx";
import { fail } from "../lib/fail";
import { mutate } from "../lib/mutate";
import { who } from "../lib/who";
import { announce } from "../views/announce";

export async function makeHost(ctx: Ctx, msg: { playerId?: unknown }): Promise<void> {
  const w = await who(ctx);
  if (!w) return;
  const target = msg.playerId;
  if (typeof target !== "string") return void (await fail(ctx, "BAD_REQUEST"));
  const r = await mutate(ctx, w.code, (s) => hand(s, w.playerId ?? "tv", target));
  if (r) await announce(ctx, w.code, r.state, r.events);
}
