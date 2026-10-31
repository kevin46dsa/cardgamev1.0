/** Test double for WebSocket plus a factory that records every socket it creates. */
export class FakeSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.sent = [];
  }
  send(data) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.readyState = 3;
  }
  /** Simulate the connection opening. */
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  /** Simulate a server frame. */
  receive(body, serverNow = Date.now()) {
    this.onmessage?.({ data: JSON.stringify({ serverNow, ...body }) });
  }
  /** Simulate the network dropping. */
  drop() {
    this.readyState = 3;
    this.onclose?.();
  }
}

export function createSocketFactory() {
  const sockets = [];
  const factory = (url) => {
    const s = new FakeSocket(url);
    sockets.push(s);
    return s;
  };
  factory.sockets = sockets;
  factory.last = () => sockets[sockets.length - 1];
  return factory;
}
