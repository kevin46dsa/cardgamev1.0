import { clearConnection, findByConnection, getTv, putTv } from "@party/shared/src/db";
import { markOffline } from "@party/shared/src/rules";
import { audience } from "../lib/audience";
import type { Ctx } from "../lib/ctx";
import { mutate } from "../lib/mutate";
import { announce } from "../views/announce";
import { settle } from "./settle";

// $disconnect (also used for sockets the sender reported as gone). Order differs from the first sketch on purpose:
// clearConnection FIRST, because it is conditional on the player still being on THIS socket, so a late
// disconnect of an old socket cannot mark a player who already reconnected as offline.
// Notifies only TV + host + the current opponent (via announce), then settles overdue deadlines.
export async function disconnect(ctx: Ctx, connectionId = ctx.connectionId): Promise<void> {
  const w = await findByConnection(connectionId);
  if (!w) return;
  if (w.playerId === null) {
    const tv = await getTv(w.code);
    if (tv?.connectionId !== connectionId) return; // TV already reconnected on a newer socket
    await putTv(w.code, { tvTokenHash: tv.tvTokenHash }); // ponytail: not atomic with a tvRejoin in the same ms; the CONN# item expires by ttl
    const a = await audience(w.code);
    await Promise.all([...a.players.values()].map((c) => ctx.send(c, { event: "tvStatus", connected: false })));
  } else {
    if (!(await clearConnection(w.code, w.playerId, connectionId, ctx.now()))) return;
    const id = w.playerId;
    const r = await mutate({ ...ctx, send: async () => ({ gone: [], failed: 0 }) }, w.code, (s) => markOffline(s, id, ctx.now(), ctx.rng));
    if (r) await announce(ctx, w.code, r.state, r.events, { subject: id });
  }
  await settle(ctx, w.code, { lazy: true });
}
