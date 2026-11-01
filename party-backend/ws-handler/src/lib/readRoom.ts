import { getRoom } from "@party/shared/src/db";
import type { GameState } from "@party/shared/src/rules";
import type { Ctx } from "./ctx";
import { fail } from "./fail";

// Current room state, or an error frame (ROOM_NOT_FOUND / ROOM_ENDED) and null.
export async function readRoom(ctx: Ctx, code: string): Promise<GameState | null> {
  const r = await getRoom<GameState>(code);
  if (r?.status === "active") return r.meta;
  await fail(ctx, r ? "ROOM_ENDED" : "ROOM_NOT_FOUND");
  return null;
}
