import type { APIGatewayProxyResultV2, APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { disconnect } from "./actions/disconnect";
import { dispatch } from "./dispatch";
import type { Ctx } from "./lib/ctx";
import { endpointFor } from "./lib/endpointFor";
import { fail } from "./lib/fail";
import { CONN_MSGS_PER_SEC, checkFrame, connectionRate } from "./lib/limits";
import { makeCtx } from "./lib/makeCtx";
import { makeSender, type Sender } from "./lib/send";

export interface Deps { makeSender: (endpoint: string) => Pick<Sender, "send">; now: () => number; rng: () => number }

// $disconnect for every socket the sender reported dead during this invocation (each at most once).
async function dropGone(ctx: Ctx): Promise<void> {
  const done = new Set<string>();
  for (const id of ctx.gone) {
    if (done.has(id)) continue;
    done.add(id);
    await disconnect(ctx, id);
  }
}

export function makeHandler(deps: Deps) {
  return async function handler(event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> {
    const rc = event.requestContext;
    if (rc.routeKey === "$connect") return { statusCode: 200 }; // nothing to do; no state until a room is joined
    const sourceIp = (rc as { identity?: { sourceIp?: string } }).identity?.sourceIp ?? "unknown";
    const ctx = makeCtx(deps.makeSender(endpointFor(rc)), rc.connectionId, sourceIp, deps.now, deps.rng);
    try {
      if (rc.routeKey === "$disconnect") await disconnect(ctx);
      else {
        const frame = checkFrame(event.body);
        if (!frame.ok) await fail(ctx, frame.error, "bad or oversized frame");
        else {
          const rate = await connectionRate(ctx.connectionId);
          if (rate.allowed) await dispatch(ctx, frame.msg);
          else if (rate.count === CONN_MSGS_PER_SEC + 1) await fail(ctx, "RATE_LIMITED", "slow down"); // one warning per window
        }
      }
      await dropGone(ctx);
    } catch (e) {
      console.error("handler error", e); // never leak internals to the client
      try {
        await fail(ctx, "BAD_REQUEST", "something went wrong");
      } catch { /* socket gone: nothing to tell */ }
    }
    return { statusCode: 200 };
  };
}

export const handler = makeHandler({ makeSender, now: Date.now, rng: Math.random });
