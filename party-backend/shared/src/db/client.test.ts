import { afterEach, expect, test } from "vitest";
import { db, table } from "./client";

test("db() is created once", () => {
  expect(db()).toBe(db());
});

test("table() reads TABLE_NAME and fails loudly when missing", () => {
  expect(table()).toBe("T");
  const old = process.env.TABLE_NAME;
  delete process.env.TABLE_NAME;
  expect(() => table()).toThrow(/TABLE_NAME/);
  process.env.TABLE_NAME = old;
});

afterEach(() => {
  process.env.TABLE_NAME = "T";
});
