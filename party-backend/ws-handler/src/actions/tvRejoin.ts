import { getTv, normalizeCode, setTvConnection, verifyToken } from "@party/shared/src/db";
import type { Ctx } from "../lib/ctx";
import { audience } from "../lib/audience";
import { fail } from "../lib/fail";
import { readRoom } from "../lib/readRoom";
import { sendSnapshot } from "../views/sendSnapshot";
import { settle } from "./settle";

export async function tvRejoin(ctx: Ctx, msg: { roomCode?: unknown; tvToken?: unknown }): Promise<void> {
  const code = typeof msg.roomCode === "string" ? normalizeCode(msg.roomCode) : null;
  if (!code) return void (await fail(ctx, "ROOM_NOT_FOUND"));
  if (!(await readRoom(ctx, code))) return;
  const tv = await getTv(code);
  if (!tv?.tvTokenHash || typeof msg.tvToken !== "string" || !verifyToken(msg.tvToken, tv.tvTokenHash)) return void (await fail(ctx, "TOKEN_INVALID"));
  await settle(ctx, code, { lazy: true });
  await setTvConnection(code, ctx.connectionId);
  const s = await readRoom(ctx, code);
  if (!s) return;
  await sendSnapshot(ctx, ctx.connectionId, code, s, "tv");
  const a = await audience(code, s);
  await Promise.all([...a.players.values()].map((c) => ctx.send(c, { event: "tvStatus", connected: true })));
}
