import { getPlayer, normalizeCode, setConnection, verifyToken } from "@party/shared/src/db";
import { rejoinPlayer } from "@party/shared/src/rules";
import type { Ctx } from "../lib/ctx";
import { fail } from "../lib/fail";
import { mutate } from "../lib/mutate";
import { readRoom } from "../lib/readRoom";
import { announce } from "../views/announce";
import { sendSnapshot } from "../views/sendSnapshot";
import { settle } from "./settle";

export async function rejoin(ctx: Ctx, msg: { roomCode?: unknown; playerId?: unknown; token?: unknown }): Promise<void> {
  const code = typeof msg.roomCode === "string" ? normalizeCode(msg.roomCode) : null;
  if (!code) return void (await fail(ctx, "ROOM_NOT_FOUND"));
  if (!(await readRoom(ctx, code))) return;
  const p = typeof msg.playerId === "string" && typeof msg.token === "string" ? await getPlayer(code, msg.playerId) : null;
  if (!p || !verifyToken(msg.token as string, p.tokenHash)) return void (await fail(ctx, "TOKEN_INVALID"));
  const id = msg.playerId as string;
  // Overdue deadlines first, while this player is still offline: a contestant who was away past the grace has
  // forfeited before they come back (rejoinPlayer would otherwise reset the clock).
  await settle(ctx, code, { lazy: true });
  const r = await mutate(ctx, code, (s) => rejoinPlayer(s, id, ctx.now(), ctx.rng));
  if (!r) return;
  await setConnection(code, id, ctx.connectionId);
  await announce(ctx, code, r.state, r.events, { subject: id, skip: [ctx.connectionId] });
  await sendSnapshot(ctx, ctx.connectionId, code, r.state, id);
}
