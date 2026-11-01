import { test, expect } from "./support/fixtures";
import { playGame } from "./support/driver";
test("probe 3p game", async ({ party }) => {
  test.setTimeout(240000);
  const a = await party.phone("Ann"); await a.createRoom(); const code = await a.roomCode();
  const b = await party.phone("Bob"); await b.joinRoom(code);
  const c = await party.phone("Cy"); await c.joinRoom(code);
  await a.expectPlayers(["Bob","Cy"]);
  await a.page.getByLabel(/Writing time/).fill("10");
  await a.page.getByLabel(/Voting time/).fill("5");
  await a.startButton.click();
  const run = await playGame(party, { phones: [a,b,c], mode: "phone" });
  console.log([...run.phasesSeen], run.leaks, run.entered, run.phoneVoteCountSeen);
});
