import { listAnswers, putAnswer } from "@party/shared/src/db";
import { isWriteComplete, validateAnswer } from "@party/shared/src/rules";
import { isBlocked } from "../content/isBlocked";
import type { Ctx } from "../lib/ctx";
import { audience } from "../lib/audience";
import { fail } from "../lib/fail";
import { readRoom } from "../lib/readRoom";
import { who } from "../lib/who";
import { settle } from "./settle";

// Stores the answer (editable until write ends). The first submission per contestant is announced to everyone
// as `submitted {contestantId}` (no text; at most 2 per match); an edit only re-acks the submitter.
export async function submitAnswer(ctx: Ctx, msg: { text?: unknown }): Promise<void> {
  const w = await who(ctx);
  if (!w) return;
  const id = w.playerId;
  if (!id) return void (await fail(ctx, "NOT_CONTESTANT"));
  const s = await readRoom(ctx, w.code);
  if (!s) return;
  const v = validateAnswer(s, id, msg.text as string, ctx.now());
  if ("error" in v) return void (await fail(ctx, v.error));
  if (s.settings.profanity && isBlocked(v.text)) return void (await fail(ctx, "ANSWER_BLOCKED"));
  const ak = v.ak as unknown as number; // db key param is typed number, the engine's key is "n.rp"
  const before = await listAnswers(w.code, ak);
  await putAnswer(w.code, ak, id, v.text, ctx.now());
  const first = !before.some((a) => a.playerId === id);
  const body = { event: "submitted", contestantId: id } as const;
  if (first) {
    const a = await audience(w.code);
    await Promise.all([...a.players.values(), ...(a.tv ? [a.tv] : [])].map((c) => ctx.send(c, body)));
  } else await ctx.send(ctx.connectionId, body);
  // If the other contestant already answered the count is 2; otherwise re-read (two answers can land at once).
  const count = before.some((a) => a.playerId !== id) ? 2 : (await listAnswers(w.code, ak)).length;
  if (isWriteComplete(s, count)) await settle(ctx, w.code);
}
