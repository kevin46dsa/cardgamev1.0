import type { ServerEvent } from "@party/shared/src/protocol";
import { ping } from "./actions/ping";

const actions: Record<string, () => ServerEvent> = { ping };

// Pure: parses one inbound frame, returns the event to send back to that connection.
export function dispatch(body: string | null | undefined): ServerEvent {
  let msg: { action?: unknown };
  try {
    msg = JSON.parse(body ?? "");
  } catch {
    return { event: "error", message: "invalid JSON" };
  }
  const name = msg?.action;
  const run = typeof name === "string" && Object.hasOwn(actions, name) ? actions[name] : undefined;
  return run ? run() : { event: "error", message: "unknown action" };
}
