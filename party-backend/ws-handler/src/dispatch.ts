import { advance } from "./actions/advance";
import { castVote } from "./actions/castVote";
import { chooseTieBreak } from "./actions/chooseTieBreak";
import { createRoom } from "./actions/createRoom";
import { endGame } from "./actions/endGame";
import { joinRoom } from "./actions/joinRoom";
import { kickPlayer } from "./actions/kickPlayer";
import { leaveRoom } from "./actions/leaveRoom";
import { makeHost } from "./actions/makeHost";
import { ping } from "./actions/ping";
import { playAgain } from "./actions/playAgain";
import { rejoin } from "./actions/rejoin";
import { startGame } from "./actions/startGame";
import { submitAnswer } from "./actions/submitAnswer";
import { tvPair } from "./actions/tvPair";
import { tvRejoin } from "./actions/tvRejoin";
import { updateSettings } from "./actions/updateSettings";
import type { Ctx } from "./lib/ctx";
import { fail } from "./lib/fail";
import { isGuessBlocked, withMissCounting } from "./lib/guessLimit";

type Action = (ctx: Ctx, msg: any) => Promise<void>;
const actions: Record<string, Action> = {
  ping, tvPair, createRoom, joinRoom, rejoin, tvRejoin, leaveRoom, updateSettings, startGame, kickPlayer, makeHost,
  endGame, playAgain, submitAnswer, castVote, chooseTieBreak, advance,
};

// Actions that take a room code, token or pairing code from the client: guessable, so limited per source IP.
const GUESSING_ACTIONS = new Set(["createRoom", "joinRoom", "rejoin", "tvRejoin", "tvPair"]);

// Routes one already-parsed frame by its `action` (Object.hasOwn: "toString" and friends are unknown actions).
export async function dispatch(ctx: Ctx, msg: unknown): Promise<void> {
  const name = (msg as { action?: unknown } | null)?.action;
  const run = typeof name === "string" && Object.hasOwn(actions, name) ? actions[name] : undefined;
  if (!run) return void (await fail(ctx, "BAD_REQUEST", "unknown action"));
  if (!GUESSING_ACTIONS.has(name as string)) return void (await run(ctx, msg));
  if (await isGuessBlocked(ctx.sourceIp)) return void (await fail(ctx, "RATE_LIMITED", "too many wrong codes from this network, try later"));
  await run(withMissCounting(ctx), msg);
}
