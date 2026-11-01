// Socket bot for "Funniest Answer". Node >= 22 (global WebSocket), no dependencies.
// A Bot behaves like the real client: one rejoin/handshake, arms ONE timer for nextDeadline and sends `advance`
// (host/TV at +0s, everyone else at +3s), writes/votes/chooses only when its own view says it may.
// Also used by the Playwright suite (e2e/party/support/bots.ts) to fill rooms cheaply.

export const WS_URL = process.env.WS_URL ?? "wss://gamenight-ws.nosenterprise.org";
export const FAST_SETTINGS = { writeSecs: 10, voteSecs: 5 }; // the minimum the settings allow
export const CONTESTANT_ROLES = ["contestant", "fateDecider", "lastChance"];
const ADVANCE_FALLBACK_MS = 3000;
const DEADLINE_MARGIN_MS = 250;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Deterministic PRNG (mulberry32) so a sim run is reproducible from its seed. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Bot {
  /**
   * @param {string} label name used for the player (and in logs)
   * @param {object} [o]
   * @param {boolean} [o.tv] this bot is the TV
   * @param {boolean} [o.autoplay] write/vote/choose automatically
   * @param {(bot: Bot, kind: "vote"|"tie") => string|null} [o.decide] override vote side ("A"/"B"/null = abstain) or tie choice
   * @param {() => number} [o.random]
   * @param {boolean} [o.driveAdvance] send `advance` when deadlines pass (default true)
   */
  constructor(label, o = {}) {
    this.label = label;
    this.tv = !!o.tv;
    this.autoplay = o.autoplay ?? true;
    this.driveAdvance = o.driveAdvance ?? true;
    this.decide = o.decide ?? null;
    this.random = o.random ?? Math.random;
    this.frames = []; // {at, m, raw}
    this.view = null;
    this.nextDeadline = null;
    this.offset = 0;
    this.session = null; // {roomCode, playerId, token} | {roomCode, tvToken}
    this.pairCode = null;
    this.isHost = false;
    this.answers = []; // {phaseId, text} everything this bot submitted
    this.matches = new Set();
    this.closed = false;
    this.waiters = [];
    this.timer = null;
    this._acted = new Set();
  }

  async connect() {
    this.ws = new WebSocket(WS_URL);
    this.ws.onmessage = (e) => this._onRaw(String(e.data));
    this.ws.onclose = () => {
      this.closed = true;
      clearTimeout(this.timer);
    };
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = () => reject(new Error(`${this.label}: cannot connect to ${WS_URL}`));
    });
    return this;
  }

  send(o) {
    if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(o));
  }

  close() {
    clearTimeout(this.timer);
    try { this.ws?.close(); } catch { /* already closed */ }
  }

  _onRaw(raw) {
    const m = JSON.parse(raw);
    this.frames.push({ at: Date.now(), m, raw });
    if (typeof m.serverNow === "number") this.offset = m.serverNow - Date.now();
    switch (m.event) {
      case "pairCode": this.pairCode = m.code; break;
      case "paired": this.session = { roomCode: m.roomCode, tvToken: m.tvToken }; break;
      case "roomCreated": case "joined":
        this.session = { ...(this.session ?? {}), ...(m.roomCode ? { roomCode: m.roomCode } : {}), playerId: m.playerId, token: m.token };
        break;
      case "snapshot": case "state": case "reveal": this._setView(m.view); break;
      case "hostChanged": this.isHost = m.hostId === this.session?.playerId; break;
      default: break;
    }
    if ("nextDeadline" in m) { this.nextDeadline = m.nextDeadline; this._armTimer(); }
    if (["snapshot", "state", "reveal"].includes(m.event)) this._act();
    this.waiters = this.waiters.filter((w) => !w.test());
  }

  _setView(view) {
    this.view = view;
    if (view.code && this.session && !this.session.roomCode) this.session.roomCode = view.code;
    if (view.you) this.isHost = view.you.isHost;
    if (view.match) this.matches.add(view.match.n);
  }

  _armTimer() {
    clearTimeout(this.timer);
    if (!this.driveAdvance || this.nextDeadline == null || !this.view) return;
    const phaseId = this.view.phaseId;
    const driver = this.tv || this.isHost;
    const at = this.nextDeadline - this.offset + DEADLINE_MARGIN_MS + (driver ? 0 : ADVANCE_FALLBACK_MS);
    this.timer = setTimeout(() => this.send({ action: "advance", phaseId }), Math.max(0, at - Date.now()));
  }

  _act() {
    const v = this.view;
    if (!this.autoplay || this.tv || !v?.you || !v.match) return;
    const key = `${v.phaseId}`;
    if (this._acted.has(key)) return;
    const mine = CONTESTANT_ROLES.includes(v.you.role);
    if (v.phase === "write" && mine) {
      this._acted.add(key);
      const text = `${this.label} m${v.match.n} ${Math.floor(this.random() * 1e6).toString(36)}`.slice(0, 60);
      this.answers.push({ phaseId: v.phaseId, text });
      setTimeout(() => this.send({ action: "submitAnswer", text }), 100 + this.random() * 300);
    } else if (v.phase === "vote" && !mine) {
      this._acted.add(key);
      const side = this.decide ? this.decide(this, "vote") : this.random() < 0.5 ? "A" : "B";
      if (side) setTimeout(() => this.send({ action: "castVote", side }), 100 + this.random() * 500);
    } else if (v.phase === "tiebreak" && mine) {
      this._acted.add(key);
      const choice = this.decide ? this.decide(this, "tie") : this.random() < 0.5 ? "reprompt" : "revote";
      if (choice) setTimeout(() => this.send({ action: "chooseTieBreak", choice }), 100);
    }
  }

  /** Resolves with the first frame (already received or future) matching `pred`; rejects on timeout or error frame. */
  waitFor(pred, what, ms = 15000, { allowError = false } = {}) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.waiters = this.waiters.filter((w) => w !== waiter);
        reject(new Error(`${this.label}: timeout (${ms}ms) waiting for ${what}; last events: ${this.frames.slice(-6).map((f) => f.m.event + (f.m.view ? `/${f.m.view.phase}` : "")).join(",")}`));
      }, ms);
      let seen = 0;
      const waiter = {
        test: () => {
          for (; seen < this.frames.length; seen++) {
            const { m } = this.frames[seen];
            if (m.event === "error" && !allowError) { clearTimeout(timeout); reject(new Error(`${this.label}: server error ${m.code} while waiting for ${what}`)); return true; }
            if (pred(m)) { clearTimeout(timeout); resolve(m); return true; }
          }
          return false;
        },
      };
      if (!waiter.test()) this.waiters.push(waiter);
    });
  }

  waitEvent(event, ms, opts) { return this.waitFor((m) => m.event === event, event, ms, opts); }
  waitPhase(phase, ms, opts) {
    return this.waitFor((m) => ["state", "reveal", "snapshot"].includes(m.event) && m.view?.phase === phase, `phase ${phase}`, ms, opts);
  }
  /** Error frame with the given code (used to assert rejections). */
  waitError(code, ms) { return this.waitFor((m) => m.event === "error" && m.code === code, `error ${code}`, ms, { allowError: true }); }

  // ---- lobby helpers -------------------------------------------------------------------------------------------
  async createRoom(settings = {}, { mode = "phone", pairCode } = {}) {
    this.send({ action: "createRoom", name: this.label, mode, ...(pairCode ? { pairCode } : {}), settings: { rounds: 1, ...FAST_SETTINGS, ...settings } });
    const m = await this.waitEvent("roomCreated");
    await this.waitEvent("snapshot");
    return m.roomCode;
  }
  async join(roomCode) {
    this.send({ action: "joinRoom", roomCode, name: this.label });
    await this.waitEvent("joined");
    await this.waitEvent("snapshot");
  }
  async tvPair() {
    this.send({ action: "tvPair" });
    return (await this.waitEvent("pairCode")).code;
  }
  start() { this.send({ action: "startGame" }); }
  leave() { this.send({ action: "leaveRoom" }); }
}

/** Open and connect a list of bots in sequence (gentle on the Lambda concurrency limit). */
export async function joinAll(bots, roomCode) {
  for (const b of bots) { await b.connect(); await b.join(roomCode); }
}

/** Close a room: host endGame twice (game -> lobby -> closed) and wait for roomEnded. Never throws. */
export async function endRoom(host, others = []) {
  try {
    host.send({ action: "endGame" });
    await sleep(600);
    host.send({ action: "endGame" });
    await host.waitEvent("roomEnded", 5000, { allowError: true });
  } catch { /* best effort */ }
  for (const b of [host, ...others]) b.close();
}
