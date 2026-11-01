import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { playAgain } from "./playAgain";

test("after the game: lobby for everyone, then a second full game works", async () => {
  const g = new Game({ n: 4, mode: "phone", seed: 3 });
  await g.setup();
  await g.start();
  await g.run();
  const king = g.host.view!.king;
  expect(king).toBeDefined();
  await playAgain(g.ctx(g.bots[2]!));
  expect(g.bots[2]!.errors()).toEqual(["NOT_HOST"]);
  await playAgain(g.ctx(g.host));
  g.sync();
  for (const b of g.bots) { expect(b.view!.phase).toBe("lobby"); expect(b.view!.king).toBeUndefined(); }
  await g.start();
  await g.run();
  expect(g.host.view!.king).toBeDefined();
});
