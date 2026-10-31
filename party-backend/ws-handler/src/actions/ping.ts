import type { ServerEvent } from "@party/shared/src/protocol";

export function ping(): ServerEvent {
  return { event: "pong" };
}
