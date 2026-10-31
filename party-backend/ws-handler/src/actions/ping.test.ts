import { expect, test } from "vitest";
import { ping } from "./ping";

test("ping answers pong", () => {
  expect(ping()).toEqual({ event: "pong" });
});
