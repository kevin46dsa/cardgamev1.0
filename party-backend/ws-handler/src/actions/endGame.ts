import { endRoom } from "@party/shared/src/db";
import { backToLobby } from "@party/shared/src/rules";
import type { Ctx } from "../lib/ctx";
import { audience } from "../lib/audience";
import { mutate } from "../lib/mutate";
import { who } from "../lib/who";
import { announce } from "../views/announce";

// Mid-game or after the game: everyone back to the lobby (brackets cleared). Already in the lobby: the host closes
// the room (ENDED tombstone, `roomEnded` to everyone).
export async function endGame(ctx: Ctx): Promise<void> {
  const w = await who(ctx);
  if (!w) return;
  const by = w.playerId ?? "tv";
  const flag = { close: false };
  const r = await mutate(ctx, w.code, (s) => {
    flag.close = s.phase === "lobby";
    return backToLobby(s, by); // NOT_HOST is checked here for both paths
  });
  if (!r) return;
  if (!flag.close) return announce(ctx, w.code, r.state, r.events);
  const a = await audience(w.code);
  await endRoom(w.code);
  await Promise.all([...a.players.values(), ...(a.tv ? [a.tv] : [])].map((c) => ctx.send(c, { event: "roomEnded", reason: "host" })));
}
