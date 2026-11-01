import type { Ctx } from "./ctx";
import type { Sender } from "./send";

export function makeCtx(sender: Pick<Sender, "send">, connectionId: string, sourceIp: string, now: () => number, rng: () => number): Ctx {
  const gone = new Set<string>();
  const send: Ctx["send"] = async (to, body) => {
    const r = await sender.send(to, { ...body, serverNow: now() });
    r.gone.forEach((g) => gone.add(g));
    return r;
  };
  return { connectionId, sourceIp, now, rng, send, gone };
}
