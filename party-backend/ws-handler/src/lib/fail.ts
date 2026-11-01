import { ERROR_CODES, type ErrorCode } from "@party/shared/src/rules";
import type { Ctx } from "./ctx";

// Engine/db error string -> wire code. Unknown strings (CONFLICT after 5 lost races, NOOP...) become BAD_REQUEST.
export const toCode = (e: string): ErrorCode => ((ERROR_CODES as readonly string[]).includes(e) ? (e as ErrorCode) : "BAD_REQUEST");

export function fail(ctx: Ctx, error: string, message?: string) {
  const code = toCode(error);
  const m = message ?? (error === "CONFLICT" ? "room is busy, try again" : code.toLowerCase().replaceAll("_", " "));
  return ctx.send(ctx.connectionId, { event: "error", code, message: m });
}
