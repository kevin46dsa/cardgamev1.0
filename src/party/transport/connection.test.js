import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BACKOFF_MS, CONN, GIVE_UP_AFTER_MS, PING_INTERVAL_MS, STALE_AFTER_MS } from "../config";
import { createSocketFactory } from "../testing/fakeSocket";
import { createConnection } from "./connection";

function setup(overrides = {}) {
  const socketFactory = createSocketFactory();
  const statuses = [];
  const messages = [];
  const doc = new EventTarget();
  doc.hidden = false;
  const conn = createConnection({
    url: "wss://test",
    socketFactory,
    onStatus: (s) => statuses.push(s),
    onMessage: (m) => messages.push(m),
    handshake: () => ({ action: "rejoin", roomCode: "KQXM", playerId: "p1", token: "t" }),
    doc,
    ...overrides,
  });
  return { conn, socketFactory, statuses, messages, doc };
}

describe("connection manager", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("sends exactly one handshake per open and parses frames", () => {
    const { conn, socketFactory, messages } = setup();
    conn.connect();
    const ws = socketFactory.last();
    ws.open();
    expect(ws.sent).toEqual([{ action: "rejoin", roomCode: "KQXM", playerId: "p1", token: "t" }]);
    ws.receive({ event: "pong" });
    expect(messages[0].event).toBe("pong");
  });

  it("reconnects with 1,2,4,8,16,30,30 second backoff and rejoins once each time", () => {
    const { conn, socketFactory } = setup();
    conn.connect();
    for (const delay of [...BACKOFF_MS.slice(0, 6), BACKOFF_MS[5]]) {
      socketFactory.last().drop();
      const before = socketFactory.sockets.length;
      vi.advanceTimersByTime(delay - 1);
      expect(socketFactory.sockets.length).toBe(before);
      vi.advanceTimersByTime(1);
      expect(socketFactory.sockets.length).toBe(before + 1);
    }
    const ws = socketFactory.last();
    ws.open();
    expect(ws.sent).toHaveLength(1);
  });

  it("resets the backoff after a successful open", () => {
    const { conn, socketFactory } = setup();
    conn.connect();
    socketFactory.last().drop();
    vi.advanceTimersByTime(BACKOFF_MS[0]);
    socketFactory.last().open();
    socketFactory.last().drop();
    const n = socketFactory.sockets.length;
    vi.advanceTimersByTime(BACKOFF_MS[0]);
    expect(socketFactory.sockets.length).toBe(n + 1);
  });

  it("does not retry while the tab is hidden, and retries when it becomes visible", () => {
    const { conn, socketFactory, doc } = setup();
    conn.connect();
    doc.hidden = true;
    socketFactory.last().drop();
    vi.advanceTimersByTime(BACKOFF_MS[0] * 10);
    expect(socketFactory.sockets).toHaveLength(1);
    doc.hidden = false;
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(socketFactory.sockets).toHaveLength(2);
  });

  it("gives up after two minutes and Try again restarts", () => {
    const { conn, socketFactory, statuses } = setup();
    conn.connect();
    const guard = 50;
    for (let i = 0; i < guard && statuses.at(-1) !== CONN.FAILED; i++) {
      socketFactory.last().drop();
      vi.advanceTimersByTime(BACKOFF_MS[5]);
    }
    expect(statuses.at(-1)).toBe(CONN.FAILED);
    const count = socketFactory.sockets.length;
    vi.advanceTimersByTime(GIVE_UP_AFTER_MS);
    expect(socketFactory.sockets).toHaveLength(count);
    conn.retry();
    expect(socketFactory.sockets).toHaveLength(count + 1);
  });

  it("pings while open and reopens a socket that has gone silent", () => {
    const { conn, socketFactory } = setup();
    conn.connect();
    const ws = socketFactory.last();
    ws.open();
    vi.advanceTimersByTime(PING_INTERVAL_MS);
    expect(ws.sent.filter((m) => m.action === "ping")).toHaveLength(1);
    vi.advanceTimersByTime(STALE_AFTER_MS);
    expect(socketFactory.sockets).toHaveLength(2);
  });

  it("close stops reconnecting", () => {
    const { conn, socketFactory } = setup();
    conn.connect();
    conn.close();
    vi.advanceTimersByTime(BACKOFF_MS[5] * 3);
    expect(socketFactory.sockets).toHaveLength(1);
  });
});
