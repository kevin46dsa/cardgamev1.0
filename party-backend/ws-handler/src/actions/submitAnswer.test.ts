import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { submitAnswer } from "./submitAnswer";

const writing = async (mode: "tv" | "phone" = "tv", n = 4) => {
  const g = new Game({ n, mode });
  await g.setup();
  await g.toWrite();
  return g;
};

test.each([
  ["", "ANSWER_EMPTY"], ["   ", "ANSWER_EMPTY"], ["x".repeat(61), "ANSWER_TOO_LONG"], [42, "ANSWER_EMPTY"], ["what the fuck", "ANSWER_BLOCKED"],
])("rejects %j with %s", async (text, code) => {
  const g = await writing();
  const c = g.contestants[0]!;
  await submitAnswer(g.ctx(c), { text });
  expect(c.errors()).toEqual([code]);
});

test("profanity filter is off when the host turned it off", async () => {
  const g = new Game({ n: 4, mode: "phone", settings: { profanity: false } });
  await g.setup();
  await g.toWrite();
  await submitAnswer(g.ctx(g.contestants[0]!), { text: "what the fuck" });
  expect(g.contestants[0]!.errors()).toEqual([]);
});

test("roles and phases: crowd, TV, and intro phase are refused", async () => {
  const g = new Game({ n: 4, mode: "tv" });
  await g.setup();
  await g.start();
  await submitAnswer(g.ctx(g.contestants[0]!), { text: "too early" });
  await g.tick();
  await submitAnswer(g.ctx(g.crowd[0]!), { text: "not me" });
  await submitAnswer(g.ctx(g.tv!), { text: "tv" });
  expect(g.contestants[0]!.errors()).toEqual(["WRONG_PHASE"]);
  expect(g.crowd[0]!.errors()).toEqual(["NOT_CONTESTANT"]);
  expect(g.tv!.errors()).toEqual(["NOT_CONTESTANT"]);
});

test("`submitted` (id only) reaches everyone once; an edit only re-acks the author; the opponent never sees the text", async () => {
  const g = await writing();
  const [a, b] = g.contestants as [Bot, Bot];
  await submitAnswer(g.ctx(a), { text: "first take" });
  for (const x of g.everyone) expect(x.inbox().filter((m) => m.event === "submitted")).toEqual([{ event: "submitted", contestantId: a.id, serverNow: g.w.clock.t }]);
  await submitAnswer(g.ctx(a), { text: "second take" });
  expect(a.inbox().filter((m) => m.event === "submitted")).toHaveLength(2);
  expect(b.inbox().filter((m) => m.event === "submitted")).toHaveLength(1);
  for (const x of [b, g.tv!]) expect(JSON.stringify(x.inbox())).not.toMatch(/first take|second take/);
  g.sync();
  expect(g.ref.view!.phase).toBe("write");
});

test("both answered -> voting opens right away, with the LAST edit of each answer", async () => {
  const g = await writing();
  const [a, b] = g.contestants as [Bot, Bot];
  await submitAnswer(g.ctx(a), { text: "draft" });
  await submitAnswer(g.ctx(a), { text: "final A" });
  await submitAnswer(g.ctx(b), { text: "final B" });
  g.sync();
  expect(g.ref.view!.phase).toBe("vote");
  expect(Object.values(g.ref.view!.match!.sides!).sort()).toEqual(["final A", "final B"]);
});

test("two answers landing at the same moment still end the phase", async () => {
  for (let i = 0; i < 5; i++) {
    const g = await writing("phone", 3);
    const [a, b] = g.contestants as [Bot, Bot];
    await Promise.all([submitAnswer(g.ctx(a), { text: "at once A" }), submitAnswer(g.ctx(b), { text: "at once B" })]);
    g.sync();
    expect(g.ref.view!.phase).toBe("vote");
  }
});

test("a late answer (after the deadline) is WRONG_PHASE", async () => {
  const g = await writing();
  g.w.clock.t = g.ref.view!.endsAt + 1;
  await submitAnswer(g.ctx(g.contestants[0]!), { text: "late" });
  expect(g.contestants[0]!.errors()).toEqual(["WRONG_PHASE"]);
});
