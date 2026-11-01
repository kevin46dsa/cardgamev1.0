import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { chooseTieBreak } from "./chooseTieBreak";
import { castVote } from "./castVote";

const tied = async () => {
  const g = new Game({ n: 4, mode: "tv" });
  await g.setup();
  await g.toVote();
  await castVote(g.ctx(g.crowd[0]!), { side: "A" });
  await castVote(g.ctx(g.crowd[1]!), { side: "B" });
  g.sync();
  expect(g.phase).toBe("tiebreak");
  return g;
};

test("both agree -> they move on at once", async () => {
  const g = await tied();
  const [a, b] = g.contestants as [Bot, Bot];
  await chooseTieBreak(g.ctx(a), { choice: "reprompt" });
  expect(a.last("ack")).toMatchObject({ action: "chooseTieBreak" });
  g.sync();
  expect(g.phase).toBe("tiebreak");
  await chooseTieBreak(g.ctx(b), { choice: "reprompt" });
  g.sync();
  expect(g.phase).toBe("write");
  expect(g.ref.view!.match!.replay).toBe(1);
});

test("one chooses, the other does not -> deadline settles it as a revote", async () => {
  const g = await tied();
  await chooseTieBreak(g.ctx(g.contestants[0]!), { choice: "reprompt" });
  await g.tick();
  expect(g.phase).toBe("vote");
  expect(g.ref.view!.match!.replay).toBe(1);
});

test("refusals: crowd, TV, bad choice, wrong phase", async () => {
  const g = await tied();
  await chooseTieBreak(g.ctx(g.crowd[0]!), { choice: "revote" });
  await chooseTieBreak(g.ctx(g.tv!), { choice: "revote" });
  await chooseTieBreak(g.ctx(g.contestants[0]!), { choice: "maybe" });
  expect(g.crowd[0]!.errors()).toEqual(["NOT_CONTESTANT"]);
  expect(g.tv!.errors()).toEqual(["NOT_CONTESTANT"]);
  expect(g.contestants[0]!.errors()).toEqual(["BAD_REQUEST"]);
  await g.tick();
  await chooseTieBreak(g.ctx(g.contestants[0]!), { choice: "revote" });
  expect(g.contestants[0]!.errors()).toEqual(["BAD_REQUEST", "WRONG_PHASE"]);
});
