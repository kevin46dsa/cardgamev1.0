import { findByConnection } from "@party/shared/src/db";
import type { Ctx } from "./ctx";
import { fail } from "./fail";

// Who is behind this socket? playerId null = the TV. Not bound to a room yet -> error and null.
export async function who(ctx: Ctx): Promise<{ code: string; playerId: string | null } | null> {
  const w = await findByConnection(ctx.connectionId);
  if (!w) await fail(ctx, "TOKEN_INVALID", "join or rejoin a room first");
  return w;
}
