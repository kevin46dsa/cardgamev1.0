import { hit } from "@party/shared/src/db";

export const MAX_FRAME_BYTES = 2048;
export const CONN_MSGS_PER_SEC = 10;
export const CREATE_ROOMS_PER_HOUR = 10;

// Cheap guard before any DynamoDB work. Returns the parsed message, or BAD_REQUEST.
export function checkFrame(body: string | undefined): { ok: true; msg: unknown } | { ok: false; error: "BAD_REQUEST" } {
  if (!body || Buffer.byteLength(body) > MAX_FRAME_BYTES) return { ok: false, error: "BAD_REQUEST" };
  try {
    return { ok: true, msg: JSON.parse(body) };
  } catch {
    return { ok: false, error: "BAD_REQUEST" };
  }
}

export const connectionRate = (connectionId: string, limit = CONN_MSGS_PER_SEC) => hit(`conn:${connectionId}`, 1, limit);

export const createRoomRate = (sourceIp: string, limit = CREATE_ROOMS_PER_HOUR) => hit(`ip:${sourceIp}`, 3600, limit);
