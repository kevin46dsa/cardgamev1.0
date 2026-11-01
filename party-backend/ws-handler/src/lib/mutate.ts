import { withRoom } from "@party/shared/src/db";
import type { GameState, Ok, Res } from "@party/shared/src/rules";
import type { Ctx } from "./ctx";
import { fail } from "./fail";

// One engine step through withRoom. `step` runs once per attempt (it is re-run on a version conflict), and only the
// LAST run's result is kept, so callers do their side effects after this returns. null = an error was sent.
export async function mutate(ctx: Ctx, code: string, step: (s: GameState) => Res): Promise<Ok | null> {
  const last: { ok?: Ok } = {};
  const r = await withRoom<GameState>(code, (s) => {
    const o = step(s);
    if ("error" in o) return o;
    last.ok = o;
    return o.state;
  });
  if ("error" in r) {
    await fail(ctx, r.error);
    return null;
  }
  return last.ok as Ok;
}
