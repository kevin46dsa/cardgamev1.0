import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { updateSettings } from "./updateSettings";

test("host changes settings: everyone in the lobby (TV too) gets `settings` with the new estimate", async () => {
  const g = new Game({ n: 3, mode: "tv" });
  await g.setup();
  await updateSettings(g.ctx(g.host), { action: "updateSettings", rounds: 3, writeSecs: 30, profanity: false });
  for (const b of g.everyone) expect(b.last("settings").settings).toMatchObject({ rounds: 3, writeSecs: 30, profanity: false, voteSecs: 15 });
  expect(g.host.last("settings").estimatedMinutes).toBeGreaterThan(0);
});

test("non-host NOT_HOST, bad values BAD_REQUEST, after start GAME_STARTED", async () => {
  const g = new Game({ n: 3, mode: "phone" });
  await g.setup();
  const p2 = g.bots[1]!;
  await updateSettings(g.ctx(p2), { rounds: 2 });
  await updateSettings(g.ctx(g.host), { rounds: 4 });
  await updateSettings(g.ctx(g.host), { writeSecs: "fast" });
  await g.start();
  await updateSettings(g.ctx(g.host), { rounds: 2 });
  expect(p2.errors()).toEqual(["NOT_HOST"]);
  expect(g.host.errors()).toEqual(["BAD_REQUEST", "BAD_REQUEST", "GAME_STARTED"]);
});
