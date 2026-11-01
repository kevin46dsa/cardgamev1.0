import { startGame as start } from "@party/shared/src/rules";
import type { Ctx } from "../lib/ctx";
import { mutate } from "../lib/mutate";
import { PROMPT_IDS } from "../lib/prompts";
import { who } from "../lib/who";
import { announce } from "../views/announce";

// Host phone or the attached TV (the engine accepts byId "tv"). Everyone gets `state` with their own view.
export async function startGame(ctx: Ctx): Promise<void> {
  const w = await who(ctx);
  if (!w) return;
  const r = await mutate(ctx, w.code, (s) => start(s, w.playerId ?? "tv", PROMPT_IDS, ctx.now(), ctx.rng));
  if (r) await announce(ctx, w.code, r.state, r.events);
}
