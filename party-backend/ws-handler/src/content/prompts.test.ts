import { expect, test } from "vitest";
import prompts from "./prompts.json";

test("2042 prompts", () => expect(prompts).toHaveLength(2042));
test("ids unique", () => expect(new Set(prompts.map((p) => p.id)).size).toBe(prompts.length));
test("tier is G or PG13", () => expect(prompts.every((p) => p.tier === "G" || p.tier === "PG13")).toBe(true));
test("text is non-empty and at most 90 chars", () =>
  expect(prompts.every((p) => p.text.trim().length > 0 && p.text.length <= 90)).toBe(true));
test("only FS- prompts have exactly one blank", () =>
  expect(prompts.every((p) => (p.text.split("______").length - 1) === (p.id.startsWith("FS-") ? 1 : 0))).toBe(true));
test("no two prompts share the same first five words", () => {
  const keys = prompts.map((p) => p.text.toLowerCase().split(/\s+/).slice(0, 5).join(" "));
  expect(new Set(keys).size).toBe(keys.length);
});
