import { updateSettings as apply, type Settings } from "@party/shared/src/rules";
import type { Ctx } from "../lib/ctx";
import { mutate } from "../lib/mutate";
import { who } from "../lib/who";
import { announce } from "../views/announce";

// Host only, lobby only (engine checks). The new settings go to everyone in the lobby.
export async function updateSettings(ctx: Ctx, msg: Record<string, unknown>): Promise<void> {
  const w = await who(ctx);
  if (!w) return;
  const { action, ...patch } = msg;
  void action;
  const r = await mutate(ctx, w.code, (s) => apply(s, w.playerId ?? "tv", patch as Partial<Settings>));
  if (r) await announce(ctx, w.code, r.state, r.events);
}
