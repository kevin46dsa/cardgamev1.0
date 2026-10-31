import { hashToken, newPlayerToken, normalizeCode, putPlayer, setConnection } from "@party/shared/src/db";
import { addPlayer } from "@party/shared/src/rules";
import { isBlocked } from "../content/isBlocked";
import type { Ctx } from "../lib/ctx";
import { fail } from "../lib/fail";
import { mutate } from "../lib/mutate";
import { newId } from "../lib/newId";
import { announce } from "../views/announce";
import { sendSnapshot } from "../views/sendSnapshot";
import { settle } from "./settle";

export async function joinRoom(ctx: Ctx, msg: { roomCode?: unknown; name?: unknown }): Promise<void> {
  const code = typeof msg.roomCode === "string" ? normalizeCode(msg.roomCode) : null;
  const name = typeof msg.name === "string" ? msg.name.trim() : "";
  if (!code) return void (await fail(ctx, "ROOM_NOT_FOUND"));
  if (isBlocked(name)) return void (await fail(ctx, "NAME_BLOCKED"));
  const id = newId(ctx.rng);
  await settle(ctx, code, { lazy: true }); // process overdue deadlines first (no-op for a missing room)
  const r = await mutate(ctx, code, (s) => addPlayer(s, id, name, ctx.now(), ctx.rng));
  if (!r) return;
  const token = newPlayerToken();
  await putPlayer(code, id, { name, tokenHash: hashToken(token), online: true, joinedAt: ctx.now(), kicked: false });
  await setConnection(code, id, ctx.connectionId);
  await ctx.send(ctx.connectionId, { event: "joined", playerId: id, token });
  await announce(ctx, code, r.state, r.events, { subject: id, skip: [ctx.connectionId] });
  await sendSnapshot(ctx, ctx.connectionId, code, r.state, id);
}
