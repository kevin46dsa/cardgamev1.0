import { backToLobby } from "@party/shared/src/rules";
import type { Ctx } from "../lib/ctx";
import { mutate } from "../lib/mutate";
import { who } from "../lib/who";
import { announce } from "../views/announce";

// Host or TV: same players, brackets cleared, everyone gets the lobby `state`.
export async function playAgain(ctx: Ctx): Promise<void> {
  const w = await who(ctx);
  if (!w) return;
  const r = await mutate(ctx, w.code, (s) => backToLobby(s, w.playerId ?? "tv"));
  if (r) await announce(ctx, w.code, r.state, r.events);
}
