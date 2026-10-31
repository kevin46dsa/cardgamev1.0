import { mulberry32 } from "@party/shared/src/rules";
import { makeHandler } from "../handler";
import * as fake from "./fakeDb";
import { FakeSender } from "./fakeSender";

// A fake API Gateway: connections, a controllable clock, a seeded rng, and the real `handler` in front of the fake db.
export function createWorld(seed = 1) {
  fake.resetDb();
  const sender = new FakeSender();
  const clock = { t: 1_700_000_000_000 };
  fake.clock.now = () => clock.t;
  const rng = mulberry32(seed);
  const handler = makeHandler({ makeSender: () => sender, now: () => clock.t, rng });
  const owners = new Map<string, string>(); // connection id -> bot name (for the leak checks)
  let n = 0;
  const ev = (routeKey: string, connectionId: string, body?: string, ip = "9.9.9.9") =>
    ({ requestContext: { routeKey, connectionId, domainName: "x.execute-api.eu-west-1.amazonaws.com", stage: "prod", identity: { sourceIp: ip } }, body }) as any;
  return {
    sender, clock, rng, owners,
    connect: async (): Promise<string> => { const id = `c${++n}`; await handler(ev("$connect", id)); return id; },
    send: (conn: string, body: object | string, ip?: string) => handler(ev("$default", conn, typeof body === "string" ? body : JSON.stringify(body), ip)),
    drop: async (conn: string) => { sender.closed.add(conn); return handler(ev("$disconnect", conn)); },
    handler, ev,
  };
}
export type World = ReturnType<typeof createWorld>;
