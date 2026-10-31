import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { startGame } from "./startGame";

test("needs 3 players and the host (or the TV)", async () => {
  const g = new Game({ n: 2, mode: "phone" });
  await g.setup();
  await startGame(g.ctx(g.host));
  expect(g.host.errors()).toEqual(["NOT_ENOUGH_PLAYERS"]);
  const b = await g.join("P3");
  await startGame(g.ctx(b));
  expect(b.errors()).toEqual(["NOT_HOST"]);
});

test("the TV can start; everyone gets `state` with their OWN view; a second start is GAME_STARTED", async () => {
  const g = new Game({ n: 4, mode: "tv" });
  await g.setup();
  await startGame(g.ctx(g.tv!));
  g.sync();
  const ids = g.bots.map((b) => b.id);
  for (const b of g.everyone) {
    expect(b.events().at(-1)).toBe("state");
    expect(b.view!.phase).toBe("intro");
    expect(b.view!.match!.prompt.length).toBeGreaterThan(5);
    expect(b.view!.match!.promptId).toMatch(/-/);
    if (!b.isTv) expect(b.view!.you!.id).toBe(b.id);
  }
  expect(g.tv!.view!.you).toBeUndefined();
  expect(g.contestants).toHaveLength(2);
  expect(g.bots.filter((b) => b.view!.you!.role === "contestant")).toHaveLength(2);
  expect(ids).toContain(g.contestants[0]!.id);
  await startGame(g.ctx(g.host));
  expect(g.host.errors()).toEqual(["GAME_STARTED"]);
  expect(g.host.last("state").nextDeadline).toBe(g.tv!.view!.endsAt);
});
