import { expect, test } from "vitest";
import { hashToken, newPlayerToken, verifyToken } from "./tokens";

test("token is 128-bit base64url and unique", () => {
  const t = newPlayerToken();
  expect(t).toMatch(/^[A-Za-z0-9_-]{22}$/);
  expect(newPlayerToken()).not.toBe(t);
});

test("hash is sha256 hex and verify accepts only the right token", () => {
  expect(hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  expect(verifyToken("abc", hashToken("abc"))).toBe(true);
  expect(verifyToken("abd", hashToken("abc"))).toBe(false);
  expect(verifyToken("abc", "short")).toBe(false);
});
