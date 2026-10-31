import { expect, test } from "vitest";
import { isConditionFailed } from "./isConditionFailed";

test("matches only ConditionalCheckFailedException", () => {
  expect(isConditionFailed(Object.assign(new Error("x"), { name: "ConditionalCheckFailedException" }))).toBe(true);
  expect(isConditionFailed(new Error("x"))).toBe(false);
  expect(isConditionFailed(null)).toBe(false);
});
