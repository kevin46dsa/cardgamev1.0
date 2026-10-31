import type { Sender } from "./send";

// Shared by every action handler; built once per Lambda invocation (now/rng injectable for tests).
export interface Ctx {
  code?: string;
  playerId?: string;
  connectionId: string;
  sourceIp: string;
  now: () => number;
  rng: () => number;
  send: Sender["send"];
  broadcast: Sender["broadcast"];
}
