// Local stand-in for API Gateway WebSocket + Lambda + DynamoDB: the REAL production handler (ws-handler/src/handler.ts, via
// makeHandler) in front of the in-memory fakeDb. `@party/shared/src/db` is swapped for fakeDb at bundle time (see server.mjs).
// Same wire protocol as wss://gamenight-ws.nosenterprise.org. Not a mock of the game: only transport and storage are fake.
import { WebSocketServer, type WebSocket } from "ws";
import { makeHandler } from "../../ws-handler/src/handler";
import { clock } from "../../ws-handler/src/testing/fakeDb";

const PORT = Number(process.env.PORT ?? 8787);
const LOG = !!process.env.LOCAL_SERVER_LOG;
const sockets = new Map<string, WebSocket>();
const closed = new Set<string>();

// Sender: PostToConnection equivalent. A socket that is gone answers like API Gateway's 410.
const sender = {
  async send(to: string, msg: unknown) {
    const ws = sockets.get(to);
    if (!ws || ws.readyState !== ws.OPEN) return { gone: [to], failed: 0 };
    ws.send(JSON.stringify(msg));
    return { gone: [] as string[], failed: 0 };
  },
};
clock.now = Date.now;
const handler = makeHandler({ makeSender: () => sender as any, now: Date.now, rng: Math.random });

let seq = 0;
const event = (routeKey: string, connectionId: string, sourceIp: string, body?: string) =>
  ({ requestContext: { routeKey, connectionId, domainName: "local", stage: "prod", identity: { sourceIp } }, body }) as any;

const wss = new WebSocketServer({ port: PORT });
wss.on("connection", (ws) => {
  const id = `local-${++seq}`;
  // Each socket gets its own "source IP" so the real createRoom limit (10/hour/IP) never starves local runs. The limiter itself is untouched.
  const ip = `10.${(seq >> 16) & 255}.${(seq >> 8) & 255}.${seq & 255}`;
  sockets.set(id, ws);
  // One invocation at a time per connection (API Gateway delivers a client's frames in order).
  let chain: Promise<unknown> = handler(event("$connect", id, ip));
  const enqueue = (e: any) => (chain = chain.then(() => handler(e)).catch((err) => console.error("invoke failed", err)));
  ws.on("message", (data) => {
    if (LOG) console.log(id, "<-", String(data));
    enqueue(event("$default", id, ip, String(data)));
  });
  ws.on("close", () => {
    closed.add(id);
    sockets.delete(id);
    enqueue(event("$disconnect", id, ip));
  });
  ws.on("error", () => ws.terminate());
});
wss.on("listening", () => console.log(`local party server on ws://localhost:${PORT} (real handler, in-memory db)`));
