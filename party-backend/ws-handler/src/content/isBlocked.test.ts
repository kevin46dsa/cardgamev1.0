import { expect, test } from "vitest";
import { isBlocked } from "./isBlocked";

test("clean text passes", () => {
  expect(isBlocked("A nice big sandwich")).toBe(false);
});

test("profane word is blocked", () => {
  expect(isBlocked("what the shit")).toBe(true);
});

test("leet speak and repeated letters are blocked", () => {
  expect(isBlocked("sh1t")).toBe(true);
  expect(isBlocked("shiiiit")).toBe(true);
});

test("Scunthorpe problem: harmless words containing a bad substring pass", () => {
  for (const s of ["Scunthorpe", "Cassandra", "classic assassin"]) expect(isBlocked(s)).toBe(false);
});

test("a real first name that is also an insult is blocked on purpose", () => {
  expect(isBlocked("Dick")).toBe(true);
});
