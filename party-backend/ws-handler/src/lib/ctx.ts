import type { ServerEventBody } from "@party/shared/src/protocol";
import type { SendResult } from "./send";

// Shared by every action handler; built once per Lambda invocation (now/rng injectable for tests).
export interface Ctx {
  connectionId: string;
  sourceIp: string;
  now: () => number;
  rng: () => number;
  // Stamps serverNow, and records dead sockets in `gone` (the handler turns those into a $disconnect pass).
  send: (connectionId: string, body: ServerEventBody) => Promise<SendResult>;
  gone: Set<string>;
}
