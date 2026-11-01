import { COPY, MAX_PLAYERS } from "./support/constants";
import { Bot, botName, endRoom, joinAll } from "./support/bots";
import { expect, test } from "./support/fixtures";
import { NAMES, seat } from "./support/flows";

test.describe("lobby", () => {
  test("players join and everyone sees the roster; host sees a tag", async ({ party }) => {
    const { host, phones } = await seat(party, 3);
    for (const p of phones) await p.expectPlayers(NAMES.slice(0, 3));
    await expect(host.rosterRow("Ann")).toContainText("(host)");
  });

  test("name already taken and wrong room code show errors", async ({ party }) => {
    const { host, code } = await seat(party, 2);
    const dup = await party.phone("Dup");
    await dup.page.getByLabel("Room code").fill(code);
    await dup.page.getByLabel("Your name").fill(NAMES[0]!); // host's name
    await dup.page.getByRole("button", { name: "Join", exact: true }).click();
    await dup.expectError(COPY.NAME_TAKEN);
    await party.shot(dup, "error-name-taken");
    // case-insensitive duplicate too
    await dup.page.getByLabel("Your name").fill(NAMES[0]!.toUpperCase());
    await dup.page.getByRole("button", { name: "Join", exact: true }).click();
    await dup.expectError(COPY.NAME_TAKEN);
    // wrong room code
    await dup.page.getByLabel("Room code").fill("QQQQ");
    await dup.page.getByLabel("Your name").fill("Zed");
    await dup.page.getByRole("button", { name: "Join", exact: true }).click();
    await dup.expectError(COPY.ROOM_NOT_FOUND);
    await party.shot(dup, "error-room-not-found");
    await expect(host.roster).not.toContainText("Dup");
  });

  test("invalid and blocked names are rejected by the server", async ({ party }) => {
    const { code } = await seat(party, 2);
    const p = await party.phone("X");
    const tryName = async (name: string, copy: RegExp) => {
      await p.page.getByLabel("Room code").fill(code);
      await p.page.getByLabel("Your name").fill(name);
      await p.page.getByRole("button", { name: "Join", exact: true }).click();
      await p.expectError(copy);
      await p.page.getByRole("alert").getByRole("button", { name: "Dismiss" }).click();
    };
    await tryName("fuck", COPY.NAME_BLOCKED);
    await party.shot(p, "error-name-blocked");
    await tryName("<b>", COPY.NAME_INVALID);
    await party.shot(p, "error-name-invalid");
    // the client trims and caps the name at 12 characters
    await p.page.getByLabel("Your name").fill("ABCDEFGHIJKLMNOP");
    await expect(p.page.getByLabel("Your name")).toHaveValue("ABCDEFGHIJKL");
  });

  test("host settings reach the other phones and the room estimate", async ({ party }) => {
    const { host, phones } = await seat(party, 3);
    const guest = phones[1]!;
    await expect(guest.page.getByText(/^1 round, about/)).toBeVisible();
    await host.page.getByLabel("Rounds").selectOption("2");
    await expect(guest.page.getByText(/^2 rounds, about/)).toBeVisible({ timeout: 15_000 });
    await host.page.getByLabel("Odd player starts in").selectOption("comeback");
    await host.page.getByLabel("Filter bad language").uncheck();
    await host.page.getByLabel(/Writing time/).fill("20");
    await expect(host.page.getByText("Writing time: 20s")).toBeVisible();
    await expect(guest.page.getByLabel(/Writing time/)).toHaveCount(0); // guests get no controls
    await party.shot(host, "lobby-settings");
    // the settings stuck on the server: a reload restores them
    await host.page.reload();
    await host.waitForLobby();
    await expect(host.page.getByLabel("Rounds")).toHaveValue("2");
    await expect(host.page.getByLabel("Odd player starts in")).toHaveValue("comeback");
    await expect(host.page.getByLabel("Filter bad language")).not.toBeChecked();
    await expect(host.page.getByText("Writing time: 20s")).toBeVisible();
  });

  test("3 player minimum: Start is disabled with 2 players and enables at 3", async ({ party }) => {
    const { host, code } = await seat(party, 2);
    await expect(host.startButton).toBeDisabled();
    await expect(host.notEnough).toBeVisible();
    const third = await party.phone(NAMES[2]!);
    await third.joinRoom(code);
    await third.waitForLobby();
    await expect(host.startButton).toBeEnabled({ timeout: 15_000 });
    await expect(host.notEnough).toHaveCount(0);
  });

  test("host kicks a player, who cannot come back @walkthrough", async ({ party }) => {
    const { host, phones, code } = await seat(party, 3);
    const victim = phones[2]!;
    await party.caption("Host removes Cy from the lobby", host, victim);
    await host.kickButton("Cy").click();
    await victim.expectNotice(COPY.KICKED_TITLE);
    await party.shot(victim, "kicked");
    await expect(host.roster).not.toContainText("Cy");
    await expect(host.page.getByRole("heading", { name: "Players 2 / 10" })).toBeVisible();
    // back to start, then try to join again: refused
    await victim.page.getByRole("button", { name: "Back to start" }).click();
    await victim.joinRoom(code);
    await victim.expectError(COPY.KICKED);
  });

  test("make host hands over the controls", async ({ party }) => {
    const { host, phones } = await seat(party, 3);
    const bob = phones[1]!;
    await host.hostButton("Bob").click();
    await expect(bob.startButton).toBeVisible({ timeout: 15_000 });
    await expect(host.startButton).toHaveCount(0);
    await expect(bob.rosterRow("Bob")).toContainText("(host)");
    await expect(host.page.getByText("Waiting for the host to start.")).toBeVisible();
  });

  test("a player leaves and the roster updates; leavers can rejoin before the game", async ({ party }) => {
    const { host, phones, code } = await seat(party, 3);
    const bob = phones[1]!;
    await bob.leaveButton.click();
    await bob.expectNotice(COPY.LEFT_TITLE);
    await party.shot(bob, "left");
    await expect(host.page.getByRole("heading", { name: "Players 2 / 10" })).toBeVisible({ timeout: 15_000 });
    await expect(host.roster).not.toContainText("Bob");
    await bob.page.getByRole("button", { name: "Back to start" }).click();
    await bob.joinRoom(code);
    await bob.waitForLobby();
    await host.expectPlayerCount(3);
  });

  test("host leaving hands the room to someone else", async ({ party }) => {
    const { host, phones } = await seat(party, 3);
    await host.leaveButton.click();
    await host.expectNotice(COPY.LEFT_TITLE);
    await expect(phones[1]!.startButton).toBeVisible({ timeout: 15_000 });
  });

  test("room holds 10 players; the 11th gets ROOM_FULL @walkthrough", async ({ party }) => {
    test.setTimeout(180_000);
    const { host, code } = await seat(party, 1);
    const bots = Array.from({ length: MAX_PLAYERS - 1 }, (_, i) => new Bot(botName(`F${i}`), { autoplay: false, driveAdvance: false }));
    party.bots.push(...bots);
    await joinAll(bots, code);
    await host.expectPlayerCount(MAX_PLAYERS);
    const late = await party.phone("Late");
    await late.joinRoom(code);
    await late.expectError(COPY.ROOM_FULL);
    await party.shot(late, "error-room-full");
    await party.shot(host, "lobby-full");
    await host.expectPlayerCount(MAX_PLAYERS);
    // a seat frees up: the same phone can now get in
    bots[0]!.leave();
    await host.expectPlayerCount(MAX_PLAYERS - 1);
    await late.page.getByRole("alert").getByRole("button", { name: "Dismiss" }).click();
    await late.page.getByRole("button", { name: "Join", exact: true }).click();
    await late.waitForLobby();
    await endRoom(bots[1]!, []); // best effort; the fixture also closes the room through the host
  });
});
