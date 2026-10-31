// Messages over the WebSocket. Phones/TV send actions only; the server replies with events.
export type ClientAction = { action: "ping" };

export type ServerEvent = { event: "pong" } | { event: "error"; message: string };
