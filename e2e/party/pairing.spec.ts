import { COPY, ROUTES } from "./support/constants";
import { expect, test } from "./support/fixtures";
import { NAMES } from "./support/flows";

test.describe("pairing and room creation", () => {
  test("TV shows a pairing code, a phone creates a room in tv mode, TV shows the lobby @walkthrough", async ({ party }) => {
    const tv = await party.tv();
    await party.caption("TV opens /party/tv and asks for a pairing code", tv);
    const pair = await tv.pairCode();
    await party.shot(tv, "pairing-code");
    const host = await party.phone(NAMES[0]!);
    await party.shot(host, "entry-join");
    await party.caption("Host phone: Create a room, enter the TV code", host);
    await host.createRoom(pair);
    await host.waitForLobby();
    const code = await host.roomCode();
    await expect(tv.page.getByRole("region", { name: "Join" })).toBeVisible({ timeout: 15_000 });
    expect(await tv.roomCode()).toBe(code);
    await tv.expectPlayers([NAMES[0]!]);
    await expect(tv.startButton).toBeDisabled();
    await party.shot(tv, "lobby");
    await party.shot(host, "lobby-host");
    expect(await host.isHost()).toBe(true);
    expect((await tv.session())?.roomCode).toBe(code);
  });

  test("phone-only mode needs no TV, and /party/join/CODE prefills the code", async ({ party }) => {
    const host = await party.phone(NAMES[0]!);
    await host.createRoom();
    await host.waitForLobby();
    const code = await host.roomCode();
    const guest = await party.phone(NAMES[1]!, { path: ROUTES.join(code) });
    await expect(guest.page.getByLabel("Room code")).toHaveValue(code);
    await guest.page.getByLabel("Your name").fill(NAMES[1]!);
    await guest.page.getByRole("button", { name: "Join", exact: true }).click();
    await guest.waitForLobby();
    await host.expectPlayers([NAMES[1]!]);
    await expect(guest.startButton).toHaveCount(0);
    await expect(guest.page.getByText("Waiting for the host to start.")).toBeVisible();
    await party.shot(guest, "lobby-guest");
  });

  test("a wrong TV code is rejected with friendly copy", async ({ party }) => {
    const tv = await party.tv();
    const pair = await tv.pairCode();
    const wrong = pair === "0000" ? "1111" : "0000";
    const host = await party.phone(NAMES[0]!);
    await host.createRoom(wrong);
    await host.expectError(COPY.PAIR_INVALID);
    await party.shot(host, "error-pair-invalid");
    await expect(tv.pairingScreen).toBeVisible(); // TV is still waiting, untouched
  });

  test("entry form: Join stays disabled until code and name are filled", async ({ party }) => {
    const p = await party.phone(NAMES[0]!);
    const join = p.page.getByRole("button", { name: "Join", exact: true });
    await expect(join).toBeDisabled();
    await p.page.getByLabel("Room code").fill("ABC");
    await p.page.getByLabel("Your name").fill("Ann");
    await expect(join).toBeDisabled();
    await p.page.getByLabel("Room code").fill("ABCD");
    await expect(join).toBeEnabled();
  });
});
