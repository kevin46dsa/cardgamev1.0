import { getRoom, listAnswers, listVotes, withRoom } from "@party/shared/src/db";
import { advance, nextDeadline, type GameState, type Ok, type Side } from "@party/shared/src/rules";
import type { Ctx } from "../lib/ctx";
import { PROMPT_IDS } from "../lib/prompts";
import { announce } from "../views/announce";

// The lazy timer: runs the engine's `advance` for the room's current phase (or `phaseId` when a client sends one)
// and announces what changed. Used by `advance`, after early completion (both answers, all votes, both tie choices),
// and on rejoin / joinRoom / $disconnect so overdue deadlines (grace, host handoff, pause) are processed.
// STALE_PHASE / TOO_EARLY change nothing, send nothing and cost one read. Returns the latest state (null = no room).
export async function settle(ctx: Ctx, code: string, o: { phaseId?: number; skip?: string[]; lazy?: boolean } = {}): Promise<GameState | null> {
  const room = await getRoom<GameState>(code);
  if (!room || room.status !== "active") return null;
  const s = room.meta;
  const phaseId = o.phaseId ?? s.phaseId;
  if (phaseId !== s.phaseId) return s;
  if (o.lazy) { const d = nextDeadline(s); if (d === null || d > ctx.now()) return s; } // nothing can be overdue: skip the reads
  const m = s.match;
  let answers: Record<string, string> | undefined;
  let votes: Record<string, Side> | undefined;
  if (m && s.phase === "write") answers = Object.fromEntries((await listAnswers(code, m.ak as unknown as number)).map((a) => [a.playerId, a.text]));
  if (m && s.phase === "vote") votes = Object.fromEntries((await listVotes(code, m.vk as unknown as number)).map((v) => [v.voterId, v.side]));
  const last: { ok?: Ok } = {};
  const r = await withRoom<GameState>(code, (cur) => {
    const res = advance(cur, { phaseId, now: ctx.now(), rng: ctx.rng, promptIds: PROMPT_IDS, answers, votes });
    if (res.signal) return { error: "NOOP" }; // nothing changed: skip the write
    last.ok = res;
    return res.state;
  });
  if ("error" in r || !last.ok) return s;
  await announce(ctx, code, last.ok.state, last.ok.events, { skip: o.skip });
  return last.ok.state;
}
