import { expect, test } from "vitest";
import { dispatch } from "./dispatch";

test("routes ping", () => {
  expect(dispatch('{"action":"ping"}')).toEqual({ event: "pong" });
});

test("rejects bad JSON, missing and unknown actions", () => {
  expect(dispatch("nope")).toEqual({ event: "error", message: "invalid JSON" });
  expect(dispatch(undefined)).toEqual({ event: "error", message: "invalid JSON" });
  expect(dispatch("{}")).toEqual({ event: "error", message: "unknown action" });
  expect(dispatch('{"action":"toString"}')).toEqual({ event: "error", message: "unknown action" });
});
