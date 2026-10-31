import { BACKOFF_MS, CONN, GIVE_UP_AFTER_MS, PING_INTERVAL_MS } from "../config";
import { ping } from "./actions";

const OPEN = 1;

/**
 * WebSocket connection manager: backoff reconnect, tab-visibility pause, a single handshake message per
 * (re)connect, optional idle ping, and a give-up after GIVE_UP_AFTER_MS.
 *
 * @param {object} o
 * @param {string} o.url
 * @param {(url:string)=>WebSocket} o.socketFactory
 * @param {(msg:object)=>void} o.onMessage called with each parsed server frame
 * @param {(status:string)=>void} o.onStatus called with a CONN value
 * @param {()=>object|null} o.handshake the ONE message sent right after every open (rejoin / tvRejoin / first action)
 * @param {Document} [o.doc] injectable for tests
 * @param {()=>number} [o.nowFn]
 */
export function createConnection({ url, socketFactory, onMessage, onStatus, handshake, doc = document, nowFn = Date.now }) {
  let socket = null;
  let attempt = 0;
  let retryTimer = null;
  let pingTimer = null;
  let pingWanted = false;
  let downSince = null;
  let stopped = true;
  let status = CONN.IDLE;

  const setStatus = (next) => {
    if (next === status) return;
    status = next;
    onStatus(next);
  };
  const isOpen = () => socket?.readyState === OPEN;
  const clearRetry = () => {
    clearTimeout(retryTimer);
    retryTimer = null;
  };
  const stopPing = () => {
    clearInterval(pingTimer);
    pingTimer = null;
  };
  const startPing = () => {
    stopPing();
    if (pingWanted && isOpen()) pingTimer = setInterval(() => send(ping()), PING_INTERVAL_MS);
  };

  function send(message) {
    if (!isOpen()) return false;
    socket.send(JSON.stringify(message));
    return true;
  }

  function open() {
    clearRetry();
    if (socket) detach(socket);
    setStatus(downSince === null ? CONN.CONNECTING : CONN.RECONNECTING);
    const ws = socketFactory(url);
    socket = ws;
    ws.onopen = () => {
      if (ws !== socket) return;
      attempt = 0;
      downSince = null;
      setStatus(CONN.OPEN);
      const first = handshake();
      if (first) send(first);
      startPing();
    };
    ws.onmessage = (event) => {
      if (ws !== socket) return;
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (msg && typeof msg.event === "string") onMessage(msg);
    };
    ws.onclose = () => {
      if (ws !== socket) return;
      socket = null;
      stopPing();
      if (!stopped) scheduleRetry();
    };
    ws.onerror = () => {
      /* a close always follows an error; retry logic lives in onclose */
    };
  }

  function detach(ws) {
    ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
    try {
      ws.close();
    } catch {
      /* already closed */
    }
    socket = null;
  }

  function scheduleRetry() {
    if (downSince === null) downSince = nowFn();
    if (nowFn() - downSince >= GIVE_UP_AFTER_MS) {
      setStatus(CONN.FAILED);
      return;
    }
    setStatus(CONN.RECONNECTING);
    const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
    attempt += 1;
    clearRetry();
    retryTimer = setTimeout(() => {
      retryTimer = null;
      if (stopped) return;
      if (doc.hidden) return; // resumed by onVisibility
      open();
    }, delay);
  }

  function onVisibility() {
    if (doc.hidden || stopped || isOpen() || status === CONN.FAILED) return;
    if (status === CONN.RECONNECTING && retryTimer === null) open();
  }
  doc.addEventListener("visibilitychange", onVisibility);

  return {
    /** Open the socket (no-op when already open or connecting). */
    connect() {
      stopped = false;
      if (socket) return;
      open();
    },
    /** Manual "Try again" after FAILED. */
    retry() {
      stopped = false;
      attempt = 0;
      downSince = null;
      open();
    },
    send,
    isOpen,
    /** Enable or disable the 5-minute idle ping. */
    setIdlePing(wanted) {
      pingWanted = wanted;
      startPing();
      if (!wanted) stopPing();
    },
    /** Close for good and remove listeners. */
    close() {
      stopped = true;
      clearRetry();
      stopPing();
      doc.removeEventListener("visibilitychange", onVisibility);
      if (socket) detach(socket);
      setStatus(CONN.IDLE);
    },
  };
}
