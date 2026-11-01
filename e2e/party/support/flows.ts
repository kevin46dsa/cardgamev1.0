import { expect } from "./fixtures-reexport";
import { FAST, MAX_PLAYERS } from "./constants";
import type { Party } from "./fixtures";
import type { Phone, Tv } from "./pages";

export const NAMES = ["Ann", "Bob", "Cy", "Dee", "Eli", "Fay", "Gus", "Hal", "Ivy", "Jo"];

export interface Table { host: Phone; phones: Phone[]; tv?: Tv; code: string }

/** Host creates a room (optionally paired with a TV), the others join. Everyone ends in the lobby. */
export async function seat(party: Party, count: number, { tv = false }: { tv?: boolean } = {}): Promise<Table> {
  const screen = tv ? await party.tv() : undefined;
  const host = await party.phone(NAMES[0]!);
  await host.createRoom(screen ? await screen.pairCode() : undefined);
  await host.waitForLobby();
  const code = await host.roomCode();
  const phones = [host];
  for (const name of NAMES.slice(1, count)) {
    const p = await party.phone(name);
    await p.joinRoom(code);
    await p.waitForLobby();
    phones.push(p);
  }
  await host.expectPlayerCount(count);
  if (screen) await screen.expectPlayers(NAMES.slice(0, count));
  return { host, phones, tv: screen, code };
}

/** Host drags both sliders to the minimum (10s writing, 5s voting) so games run fast. */
export async function useFastSettings(host: Phone): Promise<void> {
  await host.page.getByLabel(/Writing time/).fill(String(FAST.writeSecs));
  await expect(host.page.getByText(`Writing time: ${FAST.writeSecs}s`)).toBeVisible();
  await host.page.getByLabel(/Voting time/).fill(String(FAST.voteSecs));
  await expect(host.page.getByText(`Voting time: ${FAST.voteSecs}s`)).toBeVisible();
}

export { MAX_PLAYERS };

/** Poll the phones until one matches; returns it with its screen state. Used where a test needs "whoever is the contestant". */
export async function findPhone(phones: Phone[], pred: (s: import("./pages").ScreenState) => boolean, what: string, timeout = 45_000): Promise<{ phone: Phone; others: Phone[] }> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    for (const p of phones) if (pred(await p.read())) return { phone: p, others: phones.filter((x) => x !== p) };
    await phones[0]!.page.waitForTimeout(200);
  }
  throw new Error(`no phone showed: ${what}`);
}

export const contestants = async (phones: Phone[]): Promise<{ both: Phone[]; crowd: Phone[] }> => {
  await Promise.all(phones.map((p) => p.waitForPhase("write")));
  const states = await Promise.all(phones.map((p) => p.read()));
  return { both: phones.filter((_, i) => states[i]!.canWrite), crowd: phones.filter((_, i) => !states[i]!.canWrite) };
};
