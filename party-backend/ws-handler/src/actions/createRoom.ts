import {
  bindPairCode, createRoom as createRoomItem, deletePairCode, endRoom, generateRoomCode, hashToken, newPlayerToken, putPlayer, putTv,
  setConnection, setTvConnection,
} from "@party/shared/src/db";
import { createLobby, updateSettings } from "@party/shared/src/rules";
import { isBlocked } from "../content/isBlocked";
import type { Ctx } from "../lib/ctx";
import { fail } from "../lib/fail";
import { createRoomRate } from "../lib/limits";
import { newId } from "../lib/newId";
import { sendSnapshot } from "../views/sendSnapshot";

// Host phone makes the room. mode "tv" + a live pairCode also attaches that TV (it gets `paired` + its snapshot).
export async function createRoom(ctx: Ctx, msg: { name?: unknown; mode?: unknown; pairCode?: unknown; settings?: unknown }): Promise<void> {
  const name = typeof msg.name === "string" ? msg.name.trim() : "";
  if (msg.mode !== "tv" && msg.mode !== "phone") return void (await fail(ctx, "BAD_REQUEST", "mode must be tv or phone"));
  if (!name || name.length > 12) return void (await fail(ctx, "NAME_INVALID"));
  if (isBlocked(name)) return void (await fail(ctx, "NAME_BLOCKED"));
  const pair = msg.mode === "tv" && msg.pairCode != null ? String(msg.pairCode) : undefined;
  if (pair !== undefined && !/^\d{4}$/.test(pair)) return void (await fail(ctx, "PAIR_INVALID"));

  const playerId = newId(ctx.rng);
  const lobby = createLobby("", playerId, name, {}, msg.mode, ctx.now());
  const cfg = updateSettings(lobby, playerId, (msg.settings ?? {}) as object);
  if ("error" in cfg) return void (await fail(ctx, cfg.error));
  if (!(await createRoomRate(ctx.sourceIp)).allowed) return void (await fail(ctx, "RATE_LIMITED", "too many rooms from this network, try later"));

  let code = "";
  for (let i = 0; i < 5 && !code; i++) {
    const c = generateRoomCode(ctx.rng);
    if (await createRoomItem(c, { ...cfg.state, code: c })) code = c;
  }
  if (!code) return void (await fail(ctx, "BAD_REQUEST", "could not allocate a room code, try again"));
  const state = { ...cfg.state, code };

  let tvConn: string | null = null;
  if (pair !== undefined) {
    tvConn = await bindPairCode(pair, code);
    if (!tvConn) {
      await endRoom(code); // ponytail: burns the code for 24 h; a failed pairing is rare
      return void (await fail(ctx, "PAIR_INVALID"));
    }
  }

  const token = newPlayerToken();
  await putPlayer(code, playerId, { name, tokenHash: hashToken(token), online: true, joinedAt: ctx.now(), kicked: false });
  await setConnection(code, playerId, ctx.connectionId);
  await ctx.send(ctx.connectionId, { event: "roomCreated", roomCode: code, playerId, token });
  await sendSnapshot(ctx, ctx.connectionId, code, state, playerId);

  if (tvConn && pair !== undefined) {
    const tvToken = newPlayerToken();
    await putTv(code, { tvTokenHash: hashToken(tvToken) });
    await setTvConnection(code, tvConn);
    await deletePairCode(pair);
    await ctx.send(tvConn, { event: "paired", roomCode: code, tvToken });
    await sendSnapshot(ctx, tvConn, code, state, "tv");
  }
}
