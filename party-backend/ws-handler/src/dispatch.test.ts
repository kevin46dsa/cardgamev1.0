import { expect, test, vi } from "vitest";
import { dispatch } from "./dispatch";
import { Bot } from "./testing/bot";
import { Game } from "./testing/game";

vi.mock("@party/shared/src/db", () => import("./testing/fakeDb"));

test.each([undefined, null, 5, "ping", [], {}, { action: 5 }, { action: "nope" }, { action: "toString" }, { action: "__proto__" }, { action: "constructor" }, { action: "hasOwnProperty" }])(
  "%j is an unknown action -> BAD_REQUEST",
  async (msg) => {
    const g = new Game({ n: 1, mode: "phone" });
    const b = await new Bot(g.w, "x").open();
    await dispatch(g.ctx(b), msg);
    expect(b.inbox()).toEqual([{ event: "error", code: "BAD_REQUEST", message: "unknown action", serverNow: g.w.clock.t }]);
  },
);

test("routes a known action", async () => {
  const g = new Game({ n: 1, mode: "phone" });
  const b = await new Bot(g.w, "x").open();
  await dispatch(g.ctx(b), { action: "ping" });
  expect(b.events()).toEqual(["pong"]);
});
