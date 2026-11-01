import { expect, test } from "vitest";
import { ALPHABET, generateRoomCode, normalizeCode } from "./roomCode";

test("alphabet has 24 letters, no O or I", () => {
  expect(ALPHABET).toHaveLength(24);
  expect(ALPHABET).not.toMatch(/[OI]/);
});

test("generateRoomCode covers the alphabet ends and stays 4 letters", () => {
  expect(generateRoomCode(() => 0)).toBe("AAAA");
  expect(generateRoomCode(() => 0.999999)).toBe("ZZZZ");
  for (let i = 0; i < 500; i++) expect(generateRoomCode(Math.random)).toMatch(/^[A-HJ-NP-Z]{4}$/);
});

test("normalizeCode trims, uppercases, rejects O/I and wrong length", () => {
  expect(normalizeCode("  kqxm ")).toBe("KQXM");
  expect(normalizeCode("KQXO")).toBeNull();
  expect(normalizeCode("KQXI")).toBeNull();
  expect(normalizeCode("KQX")).toBeNull();
  expect(normalizeCode("KQXMM")).toBeNull();
  expect(normalizeCode("KQ1M")).toBeNull();
});
