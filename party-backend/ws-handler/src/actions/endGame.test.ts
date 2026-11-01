import { expect, test, vi } from "vitest";
import { Bot } from "../testing/bot";
import { Game } from "../testing/game";

vi.mock("@party/shared/src/db", () => import("../testing/fakeDb"));

import { endGame } from "./endGame";
import { joinRoom } from "./joinRoom";

test("mid-game: everyone back in the lobby, brackets cleared, same players", async () => {
  const g = new Game({ n: 4, mode: "tv" });
  await g.setup();
  await g.toWrite();
  await endGame(g.ctx(g.bots[1]!));
  expect(g.bots[1]!.errors()).toEqual(["NOT_HOST"]);
  await endGame(g.ctx(g.host));
  g.sync();
  for (const b of g.everyone) {
    expect(b.view!.phase).toBe("lobby");
    expect(b.view!.match).toBeUndefined();
    expect(b.view!.players).toHaveLength(4);
  }
});

test("in the lobby it closes the room: roomEnded to all, later joins get ROOM_ENDED", async () => {
  const g = new Game({ n: 3, mode: "tv" });
  await g.setup();
  await endGame(g.ctx(g.host));
  for (const b of g.everyone) expect(b.last("roomEnded")).toMatchObject({ reason: "host" });
  const z = await new Bot(g.w, "Z").open();
  await joinRoom(g.ctx(z), { roomCode: g.host.roomCode, name: "Zed" });
  expect(z.errors()).toEqual(["ROOM_ENDED"]);
  await g.host.send({ action: "startGame" });
  expect(g.host.errors()).toEqual(["ROOM_ENDED"]);
});
