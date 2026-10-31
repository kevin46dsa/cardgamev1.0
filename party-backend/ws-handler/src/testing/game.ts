import { mulberry32 } from "@party/shared/src/rules";
import { makeCtx } from "../lib/makeCtx";
import { Bot } from "./bot";
import { createWorld, type World } from "./world";

export interface GameOpts { n: number; mode: "tv" | "phone"; rounds?: number; seed?: number; pAnswer?: number; pVote?: number; pSame?: number; settings?: object }

// Drives a whole game through the public handler with bots that act only on what they were sent.
export class Game {
  w: World;
  tv?: Bot;
  bots: Bot[] = [];
  down = new Set<Bot>(); // bots that are "offline": they neither act nor read
  texts = new Map<string, string>(); // answer text -> author bot name (for the secrecy checks)
  rand: () => number;
  seq = 0;
  constructor(public o: GameOpts) {
    this.w = createWorld(o.seed ?? 1);
    this.rand = mulberry32((o.seed ?? 1) + 1000);
  }
  get host() { return this.bots[0]!; }
  get everyone(): Bot[] { return this.tv ? [this.tv, ...this.bots] : this.bots; }
  get ref(): Bot { return this.tv && !this.down.has(this.tv) ? this.tv : this.bots.find((b) => !this.down.has(b))!; }
  ctx(b: Bot, ip = "1.1.1.1") { return makeCtx(this.w.sender, b.conn, ip, () => this.w.clock.t, this.w.rng); }
  get phase() { return this.ref.view!.phase; }
  get contestants(): Bot[] { return this.bots.filter((b) => this.ref.view!.match?.contestants.includes(b.id)); }
  get crowd(): Bot[] { return this.bots.filter((b) => !this.ref.view!.match?.contestants.includes(b.id)); }
  /** The deadline passes and the TV/host fires `advance` (one phase). */
  async tick() {
    const r = this.ref;
    this.w.clock.t = Math.max(this.w.clock.t, r.nd ?? this.w.clock.t + 1000);
    await r.send({ action: "advance", phaseId: r.view!.phaseId });
    this.sync();
  }
  /** Both contestants answer (voting opens by itself). */
  async answerBoth() {
    for (const b of this.contestants) await b.send({ action: "submitAnswer", text: `ans ${b.name}` });
    this.sync();
  }
  /** start -> intro -> write (needs a started game). */
  async toWrite() { await this.start(); await this.tick(); }
  /** ... -> vote. */
  async toVote() { await this.toWrite(); await this.answerBoth(); }
  sync() { for (const b of this.everyone) if (!this.down.has(b)) b.sync(); }

  async setup() {
    const { o } = this;
    let pairCode: string | undefined;
    if (o.mode === "tv") {
      this.tv = await new Bot(this.w, "TV", true).open();
      await this.tv.send({ action: "tvPair" });
      pairCode = this.tv.last("pairCode").code;
    }
    this.bots.push(await new Bot(this.w, "P1").open());
    await this.host.send({ action: "createRoom", name: "P1", mode: o.mode, pairCode, settings: { rounds: o.rounds ?? 1, ...o.settings } });
    this.host.sync();
    this.tv?.sync();
    for (let i = 2; i <= o.n; i++) await this.join(`P${i}`);
  }
  async join(name: string): Promise<Bot> {
    const b = await new Bot(this.w, name).open();
    b.roomCode = this.host.roomCode;
    this.bots.push(b);
    await b.send({ action: "joinRoom", roomCode: b.roomCode, name });
    b.sync();
    return b;
  }
  /** Socket dies (phone locked, tab closed). The bot stops acting until `rejoin`. */
  async drop(b: Bot) {
    this.down.add(b);
    await this.w.drop(b.conn);
  }
  /** New socket, one `rejoin`, like the frontend does on reconnect. */
  async rejoin(b: Bot) {
    b.conn = await this.w.connect();
    this.w.owners.set(b.conn, b.name);
    b.read = 0;
    this.down.delete(b);
    await b.send(b.isTv ? { action: "tvRejoin", roomCode: b.roomCode, tvToken: b.tvToken } : { action: "rejoin", roomCode: b.roomCode, playerId: b.id, token: b.token });
    b.sync();
  }
  async start() {
    await (this.tv ?? this.host).send({ action: "startGame" });
    this.sync();
  }

  // Everyone with something to do in the current phase does it once.
  async act(): Promise<void> {
    for (const b of this.bots) {
      const v = b.view;
      if (this.down.has(b) || !v?.match || b.acted === v.phaseId) continue;
      const mine = v.match.contestants.includes(b.id);
      if (v.phase === "write" && mine) {
        b.acted = v.phaseId;
        if (this.rand() < (this.o.pAnswer ?? 0.9)) {
          // both contestants derive the same verdict from the match number, so "identical answers" happens on purpose
          const same = (v.match.n * 31 + v.match.replay * 17) % 100 < (this.o.pSame ?? 0.08) * 100;
          const text = same ? `same ${v.match.n} ${v.match.replay}` : `ans ${++this.seq} by ${b.name}`;
          this.texts.set(text, b.name);
          await b.send({ action: "submitAnswer", text });
        }
      } else if (v.phase === "vote" && !mine) {
        b.acted = v.phaseId;
        if (this.rand() < (this.o.pVote ?? 0.95)) { await b.send({ action: "castVote", side: this.rand() < 0.5 ? "A" : "B" }); }
      } else if (v.phase === "tiebreak" && mine) {
        b.acted = v.phaseId;
        await b.send({ action: "chooseTieBreak", choice: this.rand() < 0.5 ? "reprompt" : "revote" });
      }
    }
    this.sync();
  }

  // One round of play: bots act, then (if the phase did not move on by itself) the deadline passes and the TV/host advances.
  async step(): Promise<void> {
    const before = this.ref.view!.phaseId;
    await this.act();
    const r = this.ref;
    const v = r.view!;
    if (v.phase === "final" || v.phase === "lobby" || v.phaseId !== before) return; // finished, or moved on by itself (early end)
    this.w.clock.t = Math.max(this.w.clock.t, r.nd ?? this.w.clock.t + 1000);
    await r.send({ action: "advance", phaseId: v.phaseId });
    this.sync();
  }

  async run(max = 4000): Promise<void> {
    for (let i = 0; i < max; i++) {
      this.sync();
      if (this.ref.view?.phase === "final") return;
      await this.step();
    }
    throw new Error(`game did not finish in ${max} steps (phase ${this.ref.view?.phase})`);
  }
}
