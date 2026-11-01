import type { Ctx } from "../lib/ctx";
import { fail } from "../lib/fail";
import { who } from "../lib/who";
import { settle } from "./settle";

// Client timer fired. STALE_PHASE / TOO_EARLY are silent (api.md: treat as success).
export async function advance(ctx: Ctx, msg: { phaseId?: unknown }): Promise<void> {
  if (typeof msg.phaseId !== "number") return void (await fail(ctx, "BAD_REQUEST", "phaseId must be a number"));
  const w = await who(ctx);
  if (w) await settle(ctx, w.code, { phaseId: msg.phaseId });
}
