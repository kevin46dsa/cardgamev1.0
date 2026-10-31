import { test, expect } from "./support/fixtures";
test("probe tv pairing", async ({ party }) => {
  const tv = await party.tv();
  const code = await tv.pairCode();
  console.log("pair", code);
  const ann = await party.phone("Ann");
  await ann.createRoom(code);
  await ann.waitForLobby();
  console.log("room", await ann.roomCode(), await tv.roomCode());
  await party.shot(tv, "probe-tv-lobby"); await party.shot(ann, "probe-phone-lobby");
  expect(await ann.isHost()).toBe(true);
});
