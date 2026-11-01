import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { castVote } from "./castVote";

const voting = async (mode: "tv" | "phone", n: number) => {
  const g = new Game({ n, mode });
  await g.setup();
  await g.toVote();
  return g;
};

test("voter gets voteAck; TV mode: voteCount {have, need} to the TV only", async () => {
  const g = await voting("tv", 5);
  const [v1, v2, v3] = g.crowd as [Bot, Bot, Bot];
  const before = g.w.sender.log.length;
  await castVote(g.ctx(v1), { side: "A" });
  await castVote(g.ctx(v2), { side: "B" });
  const sent = g.w.sender.log.slice(before).map((l) => `${l.msg.event}>${l.to}`);
  expect(sent).toEqual([`voteAck>${v1.conn}`, `voteCount>${g.tv!.conn}`, `voteAck>${v2.conn}`, `voteCount>${g.tv!.conn}`]);
  expect(g.tv!.inbox().filter((m) => m.event === "voteCount").map((m) => [m.have, m.need])).toEqual([[1, 3], [2, 3]]);
  expect(v1.last("voteAck").side).toBe("A");
  await castVote(g.ctx(v3), { side: "B" });
  g.sync();
  expect(g.ref.view!.phase).not.toBe("vote"); // everyone voted: no waiting for the timer
});

test("phone-only: nobody gets a live count, only the voter's ack", async () => {
  const g = await voting("phone", 5);
  const before = g.w.sender.log.length;
  await castVote(g.ctx(g.crowd[0]!), { side: "A" });
  expect(g.w.sender.log.slice(before).map((l) => l.msg.event)).toEqual(["voteAck"]);
});

test("changing a vote replaces it (count does not grow)", async () => {
  const g = await voting("tv", 5);
  await castVote(g.ctx(g.crowd[0]!), { side: "A" });
  await castVote(g.ctx(g.crowd[0]!), { side: "B" });
  expect(g.tv!.inbox().filter((m) => m.event === "voteCount").map((m) => m.have)).toEqual([1, 1]);
});

test("refusals: contestant, TV, wrong phase, bad side", async () => {
  const g = await voting("tv", 5);
  await castVote(g.ctx(g.contestants[0]!), { side: "A" });
  await castVote(g.ctx(g.tv!), { side: "A" });
  await castVote(g.ctx(g.crowd[0]!), { side: "C" });
  expect(g.contestants[0]!.errors()).toEqual(["CONTESTANT_CANNOT_VOTE"]);
  expect(g.tv!.errors()).toEqual(["BAD_REQUEST"]);
  expect(g.crowd[0]!.errors()).toEqual(["BAD_REQUEST"]);
  const w = new Game({ n: 4, mode: "phone" });
  await w.setup();
  await w.toWrite();
  await castVote(w.ctx(w.crowd[0]!), { side: "A" });
  expect(w.crowd[0]!.errors()).toEqual(["WRONG_PHASE"]);
});

test("the reveal that follows names the authors for the first time", async () => {
  const g = await voting("phone", 5);
  expect(JSON.stringify(g.crowd[0]!.inbox())).not.toContain("authors");
  for (const v of g.crowd) await castVote(g.ctx(v), { side: "A" });
  g.sync();
  expect(g.crowd[0]!.view!.match!.authors).toBeDefined();
});
