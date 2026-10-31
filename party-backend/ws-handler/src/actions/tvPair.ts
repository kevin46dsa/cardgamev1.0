import { createPairCode } from "@party/shared/src/db";
import type { Ctx } from "../lib/ctx";
import { fail } from "../lib/fail";

const PAIR_MS = 10 * 60 * 1000;

// TV asks for a 4-digit code and waits. Calling again (code expired) just makes a new one.
export async function tvPair(ctx: Ctx): Promise<void> {
  const code = await createPairCode(ctx.connectionId, ctx.rng);
  if (!code) return void (await fail(ctx, "RATE_LIMITED", "could not make a pairing code, try again"));
  await ctx.send(ctx.connectionId, { event: "pairCode", code, expiresAt: ctx.now() + PAIR_MS });
}
