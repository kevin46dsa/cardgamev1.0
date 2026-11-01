import { findByConnection, touchRoom } from "@party/shared/src/db";
import type { Ctx } from "../lib/ctx";

// Lobby / pause / pairing screens ping every 5 minutes: that also keeps the room from idle-expiring (30 min).
// Unbound sockets (TV on the pairing screen) just get a pong.
export async function ping(ctx: Ctx): Promise<void> {
  await ctx.send(ctx.connectionId, { event: "pong" });
  const w = await findByConnection(ctx.connectionId);
  if (w) await touchRoom(w.code);
}
