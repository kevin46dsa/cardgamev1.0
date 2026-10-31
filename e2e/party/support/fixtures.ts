import fs from "node:fs";
import path from "node:path";
import { devices, test as base, type Browser, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import { Bot, type BotLike } from "./bots";
import { ARTIFACTS, VIDEO_SIZE, VIEWPORT } from "./constants";
import { Phone, Tv } from "./pages";

type Kind = "tv" | "phone";
const slug = (s: string) => s.toLowerCase().replace(/@\w+/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const WALKTHROUGH_TAG = "@walkthrough";
/** Screens already photographed by this worker (a screen is "distinct" by kind + mode + phase + role). */
const photographed = new Set<string>();

/**
 * One test's worth of browsers and bots. Opens a TV and any number of phones as separate contexts (own localStorage,
 * own socket), records video + traces, photographs every new screen, and on teardown closes the rooms it created.
 */
export class Party {
  readonly screens: (Tv | Phone)[] = [];
  readonly bots: BotLike[] = [];
  readonly pageErrors: string[] = [];
  private contexts: { ctx: BrowserContext; label: string }[] = [];
  private pages: { page: Page; label: string }[] = [];

  constructor(private browser: Browser, readonly info: TestInfo) {}

  get isWalkthrough(): boolean { return this.info.title.includes(WALKTHROUGH_TAG) || this.info.tags.includes(WALKTHROUGH_TAG); }
  get scenario(): string { return slug(this.info.title); }

  private async newScreen(kind: Kind, label: string): Promise<{ page: Page; ctx: BrowserContext }> {
    const video = this.info.project.use.video;
    const record = video === "on" || video === "retain-on-failure" || (typeof video === "object" && video.mode !== "off");
    const ctx = await this.browser.newContext({
      ...(kind === "phone" ? devices["Pixel 5"] : {}),
      viewport: VIEWPORT[kind],
      baseURL: this.info.project.use.baseURL,
      ...(record ? { recordVideo: { dir: this.info.outputPath("videos"), size: VIDEO_SIZE[kind] } } : {}),
    });
    if (this.info.retry > 0) await ctx.tracing.start({ screenshots: true, snapshots: true });
    ctx.on("page", (p) => this.pages.push({ page: p, label }));
    const page = await ctx.newPage();
    page.on("pageerror", (e) => this.pageErrors.push(`${label}: ${e.message}`));
    this.contexts.push({ ctx, label });
    return { page, ctx };
  }

  async tv(): Promise<Tv> {
    const { page, ctx } = await this.newScreen("tv", "tv");
    const tv = new Tv(page, ctx, "TV");
    this.screens.push(tv);
    await tv.open();
    return tv;
  }

  /** A phone browser (Pixel 5 emulation) that has opened /party. */
  async phone(name: string, { path: url }: { path?: string } = {}): Promise<Phone> {
    const { page, ctx } = await this.newScreen("phone", `phone-${name}`);
    const phone = new Phone(page, ctx, name, name);
    this.screens.push(phone);
    await phone.open(url);
    return phone;
  }

  /** Reload a phone: a closed-and-reopened browser tab that restores its seat from localStorage. */
  async bot(label: string, o: object = {}): Promise<BotLike> {
    const b = new Bot(label, { autoplay: true, ...o });
    this.bots.push(b);
    await b.connect();
    return b;
  }

  /** Burned-in subtitle so a recorded walkthrough explains itself. Survives until the next navigation. */
  async caption(text: string, ...on: (Tv | Phone)[]): Promise<void> {
    for (const s of on.length ? on : this.screens) {
      await s.page.evaluate((t) => {
        let el = document.getElementById("e2e-caption");
        if (!el) {
          el = document.createElement("div");
          el.id = "e2e-caption";
          el.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:99999;padding:6px 10px;background:rgba(0,0,0,.82);color:#fff;font:600 13px/1.3 system-ui;pointer-events:none;text-align:center";
          document.body.appendChild(el);
        }
        el.textContent = t;
      }, text).catch(() => {});
    }
  }

  /** Labelled screenshot into e2e-artifacts/screens/<tv|phone>-<label>.png (overwritten each run). */
  async shot(screen: Tv | Phone, label: string): Promise<void> {
    const kind = screen instanceof Tv ? "tv" : "phone";
    fs.mkdirSync(ARTIFACTS.screens, { recursive: true });
    await screen.page.screenshot({ path: path.join(ARTIFACTS.screens, `${kind}-${slug(label)}.png`) }).catch(() => {});
  }

  /** Photograph this screen once per distinct (kind, mode, phase, role) in the whole run. */
  async catalog(screen: Tv | Phone, mode: "tv" | "phone", state: { phase: string | null; roleTitle: string | null; headings: string[] }): Promise<void> {
    const kind = screen instanceof Tv ? "tv" : "phone";
    const key = [kind, mode, state.phase ?? "none", state.roleTitle ? slug(state.roleTitle) : "plain"].join("-");
    if (photographed.has(key)) return;
    photographed.add(key);
    await this.shot(screen, key);
  }

  async teardown(failed: boolean): Promise<void> {
    await this.closeRooms();
    for (const b of this.bots) b.close();
    if (this.pageErrors.length && failed) await this.info.attach("page-errors", { body: this.pageErrors.join("\n") });
    for (const { ctx, label } of this.contexts) {
      if (this.info.retry > 0) await ctx.tracing.stop({ path: this.info.outputPath(`trace-${label}.zip`) }).catch(() => {});
    }
    for (const { ctx } of this.contexts) await ctx.close().catch(() => {});
    await this.saveVideos(failed);
  }

  /** Best effort: end every room we touched (host endGame twice: game -> lobby -> closed) so nothing lingers on the live backend. */
  private async closeRooms(): Promise<void> {
    const sessions: any[] = [];
    for (const s of this.screens) {
      if (s instanceof Phone) {
        const x = await s.session().catch(() => null);
        if (x?.token) sessions.push(x);
      }
    }
    const byRoom = new Map<string, any[]>();
    for (const x of sessions) byRoom.set(x.roomCode, [...(byRoom.get(x.roomCode) ?? []), x]);
    for (const b of this.bots) if (b.session?.roomCode && b.session.token) byRoom.set(b.session.roomCode, [...(byRoom.get(b.session.roomCode) ?? []), b.session]);
    for (const [roomCode, list] of byRoom) {
      for (const s of list) {
        const closer = new Bot(`closer`, { autoplay: false, driveAdvance: false });
        try {
          await closer.connect();
          closer.send({ action: "rejoin", roomCode, playerId: s.playerId, token: s.token });
          const snap = await closer.waitFor((m: any) => m.event === "snapshot" || m.event === "error", "rejoin", 8000, { allowError: true });
          if (snap.event === "error" || !snap.view.you?.isHost) continue;
          closer.send({ action: "endGame" });
          await new Promise((r) => setTimeout(r, 700));
          closer.send({ action: "endGame" });
          await closer.waitEvent("roomEnded", 5000, { allowError: true });
          break;
        } catch { /* room already gone */ } finally { closer.close(); }
      }
    }
  }

  private async saveVideos(failed: boolean): Promise<void> {
    const keep = this.info.project.use.video !== "retain-on-failure" || failed;
    const seen = new Map<string, number>();
    for (const { page, label } of this.pages) {
      const v = page.video();
      if (!v) continue;
      const n = (seen.get(label) ?? 0) + 1;
      seen.set(label, n);
      const base = `${label}${n > 1 ? `-${n}` : ""}.webm`;
      try {
        if (!keep) { await v.delete(); continue; }
        const local = this.info.outputPath(`video-${base}`);
        await v.saveAs(local);
        await this.info.attach(`video-${base}`, { path: local, contentType: "video/webm" });
        if (this.isWalkthrough) {
          fs.mkdirSync(ARTIFACTS.videos, { recursive: true });
          fs.copyFileSync(local, path.join(ARTIFACTS.videos, `${this.scenario}--${base}`));
        }
      } catch { /* video not finalised (page crashed): ignore */ }
    }
  }
}

export const test = base.extend<{ party: Party }>({
  party: async ({ browser }, use, testInfo) => {
    const party = new Party(browser, testInfo);
    await use(party);
    await party.teardown(testInfo.status !== testInfo.expectedStatus);
  },
});
export { expect } from "@playwright/test";
