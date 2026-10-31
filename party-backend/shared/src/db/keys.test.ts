import { expect, test } from "vitest";
import { answerSk, pairPk, playerSk, ratePk, roomPk, voteSk } from "./keys";

test("key shapes", () => {
  expect(roomPk("KQXM")).toBe("ROOM#KQXM");
  expect(playerSk("p1")).toBe("PLAYER#p1");
  expect(answerSk(3, "p1")).toBe("ANSWER#3#p1");
  expect(voteSk(3, "p2")).toBe("VOTE#3#p2");
  expect(pairPk("0042")).toBe("PAIR#0042");
  expect(ratePk("ip:1.2.3.4")).toBe("RATE#ip:1.2.3.4");
});
