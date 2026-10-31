import { expect, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { COPY, PHASE_BY_TEXT, ROUTES, TIMEOUT, type Phase } from "./constants";

/** What a player screen looks like right now, read in one round trip. */
export interface ScreenState {
  phase: Phase | null;
  headings: string[];
  text: string;
  /** a role card ("You get a bye", "Last Chance"...) when one is shown */
  roleTitle: string | null;
  canWrite: boolean;
  canSubmit: boolean;
  voteButtons: number;
  votePressed: boolean;
  tieButtons: number;
  tieEnabled: boolean;
  hasPlayAgain: boolean;
  hasContinue: boolean;
}

const READ_SCREEN = () => {
  const main = document.querySelector("main");
  const announcer = main?.querySelector(":scope > .party-sr");
  const submit = [...document.querySelectorAll<HTMLButtonElement>('form button[type="submit"]')][0];
  const vote = [...document.querySelectorAll<HTMLButtonElement>("button.party-answer")];
  const tie = [...document.querySelectorAll<HTMLButtonElement>('[aria-label="Tie break choice"] button')];
  const buttons = [...document.querySelectorAll<HTMLButtonElement>("button")];
  return {
    announcer: announcer?.textContent?.trim() ?? "",
    headings: [...document.querySelectorAll("h1,h2")].map((h) => h.textContent?.trim() ?? ""),
    text: document.body.innerText,
    roleTitle: document.querySelector('[aria-label="Your role"] h2')?.textContent?.trim() ?? null,
    canWrite: !!document.querySelector("#party-answer"),
    canSubmit: !!submit && !submit.disabled && submit.textContent !== "Answer locked in",
    voteButtons: vote.length,
    votePressed: vote.some((b) => b.getAttribute("aria-pressed") === "true"),
    tieButtons: tie.length,
    tieEnabled: tie.some((b) => !b.disabled),
    hasPlayAgain: buttons.some((b) => b.textContent === "Play again"),
    hasContinue: buttons.some((b) => b.textContent === "Continue"),
  };
};

abstract class Screen {
  constructor(readonly page: Page, readonly context: BrowserContext, readonly label: string) {}

  /** Visually hidden live region the app updates on every phase change. */
  get announcer(): Locator { return this.page.locator("main > .party-sr"); }
  get errorBanner(): Locator { return this.page.getByRole("alert"); }
  get banners(): Locator { return this.page.locator(".party-banner"); }

  async read(): Promise<ScreenState> {
    const r = await this.page.evaluate(READ_SCREEN);
    return { ...r, phase: PHASE_BY_TEXT[r.announcer] ?? null };
  }

  async phase(): Promise<Phase | null> {
    return PHASE_BY_TEXT[(await this.announcer.textContent()) ?? ""] ?? null;
  }

  async waitForPhase(phase: Phase, timeout: number = TIMEOUT.phase): Promise<void> {
    await expect(this.announcer, `${this.label} should reach phase "${phase}"`).toHaveText(phaseText(phase), { timeout });
  }

  /** The persisted session (room code, player id, token) the app keeps in localStorage. */
  async storedSession(key: "party.session" | "party.tv"): Promise<any | null> {
    return this.page.evaluate((k) => {
      try { return JSON.parse(localStorage.getItem(k) ?? "null"); } catch { return null; }
    }, key);
  }
}

const phaseText = (phase: Phase) => Object.entries(PHASE_BY_TEXT).find(([, p]) => p === phase)![0];

export class Tv extends Screen {
  async open(): Promise<void> {
    await this.page.goto(ROUTES.tv);
  }
  get pairingScreen(): Locator { return this.page.getByRole("region", { name: "Pairing" }); }
  /** Waits for the 4-digit pairing code and returns it. */
  async pairCode(): Promise<string> {
    const code = this.page.locator('[aria-label^="TV code"]');
    await expect(code, "TV should show a 4 digit pairing code").toHaveText(/^\d{4}$/, { timeout: TIMEOUT.net });
    return (await code.textContent())!;
  }
  async roomCode(): Promise<string> {
    const code = this.page.locator('[aria-label^="Room code"]');
    await expect(code, "TV lobby should show the room code").toHaveText(/^[A-Z]{4}$/, { timeout: TIMEOUT.net });
    return (await code.textContent())!;
  }
  get roster(): Locator { return this.page.getByRole("list", { name: "Players" }); }
  get startButton(): Locator { return this.page.getByRole("button", { name: /start game/i }); }
  get playAgain(): Locator { return this.page.getByRole("button", { name: "Play again" }); }
  async expectPlayers(names: string[]): Promise<void> {
    for (const n of names) await expect(this.roster, `TV roster should list ${n}`).toContainText(n, { timeout: TIMEOUT.net });
  }
  async session() { return this.storedSession("party.tv"); }
}

export class Phone extends Screen {
  constructor(page: Page, context: BrowserContext, label: string, readonly name: string) { super(page, context, label); }

  async open(path: string = ROUTES.phone): Promise<void> {
    await this.page.goto(path);
    await expect(this.page.getByRole("heading", { name: "Funniest Answer" })).toBeVisible();
  }

  private get nameInput() { return this.page.getByLabel("Your name"); }

  /** Entry screen -> "Create a room"; leave pairCode undefined for phone-only mode. */
  async createRoom(pairCode?: string): Promise<void> {
    await this.page.getByRole("button", { name: "Create a room" }).click();
    await this.nameInput.fill(this.name);
    if (pairCode) await this.page.getByLabel("TV code (optional)").fill(pairCode);
    await this.page.getByRole("button", { name: "Create room" }).click();
  }

  /** Entry screen -> join by code. Does not wait for the result (error cases use it too). */
  async joinRoom(code: string): Promise<void> {
    await this.page.getByLabel("Room code").fill(code);
    await this.nameInput.fill(this.name);
    await this.page.getByRole("button", { name: "Join", exact: true }).click();
  }

  async roomCode(): Promise<string> {
    const code = this.page.getByRole("region", { name: "Room code" }).locator(".party-code");
    await expect(code, `${this.label} lobby should show the room code`).toHaveText(/^[A-Z]{4}$/, { timeout: TIMEOUT.net });
    return (await code.textContent())!;
  }

  async waitForLobby(): Promise<void> {
    await expect(this.page.getByRole("region", { name: "Room code" }), `${this.label} should be in the lobby`).toBeVisible({ timeout: TIMEOUT.net });
  }

  get roster(): Locator { return this.page.getByRole("list", { name: "Players" }); }
  get startButton(): Locator { return this.page.getByRole("button", { name: "Start game" }); }
  get leaveButton(): Locator { return this.page.getByRole("button", { name: "Leave game" }); }
  get playAgain(): Locator { return this.page.getByRole("button", { name: "Play again" }); }
  get continueButton(): Locator { return this.page.getByRole("button", { name: "Continue" }); }
  get notEnough(): Locator { return this.page.getByText("You need at least 3 players."); }
  get playersHeading(): Locator { return this.page.getByRole("heading", { name: /^Players \d+ \/ 10$/ }); }
  kickButton(name: string): Locator { return this.page.getByRole("button", { name: `Remove ${name}` }); }
  hostButton(name: string): Locator { return this.page.getByRole("button", { name: `Make ${name} host` }); }
  rosterRow(name: string): Locator { return this.roster.getByRole("listitem").filter({ hasText: name }); }

  async expectPlayers(names: string[]): Promise<void> {
    for (const n of names) await expect(this.roster, `${this.label} roster should list ${n}`).toContainText(n, { timeout: TIMEOUT.net });
  }
  async expectPlayerCount(n: number): Promise<void> {
    await expect(this.playersHeading).toHaveText(`Players ${n} / 10`, { timeout: TIMEOUT.net });
  }

  async isHost(): Promise<boolean> { return this.startButton.isVisible(); }

  async session() { return this.storedSession("party.session"); }

  /** Visible error text from the banner (server error codes map to friendly copy). */
  async expectError(copy: RegExp): Promise<void> {
    await expect(this.errorBanner.filter({ hasText: copy }), `${this.label} should show an error matching ${copy}`).toBeVisible({ timeout: TIMEOUT.net });
  }
  async expectNotice(title: RegExp): Promise<void> {
    await expect(this.page.getByRole("heading", { name: title }), `${this.label} should show notice ${title}`).toBeVisible({ timeout: TIMEOUT.net });
  }
}

export { COPY };
