import type { WireView } from "@party/shared/src/protocol";
import type { World } from "./world";

// A scripted client. It only knows what the server sent it: the latest view / nextDeadline plus its own credentials.
export class Bot {
  conn = "";
  id = "";
  token = "";
  tvToken = "";
  roomCode = "";
  view?: WireView;
  nd: number | null = null;
  acted = -1;
  read = 0;
  constructor(public w: World, public name: string, public isTv = false) {}
  async open() { this.conn = await this.w.connect(); this.w.owners.set(this.conn, this.name); return this; }
  send(body: object | string) { return this.w.send(this.conn, body); }
  inbox(): any[] { return this.w.sender.to(this.conn); }
  last(event: string): any { return [...this.inbox()].reverse().find((m) => m.event === event); }
  errors(): string[] { return this.inbox().filter((m) => m.event === "error").map((m) => m.code); }
  events(): string[] { return this.inbox().map((m) => m.event); }
  // Reads new messages and updates view / credentials, like the real client would.
  sync(): void {
    const all = this.inbox();
    for (const m of all.slice(this.read)) {
      if (m.view) this.view = m.view;
      if ("nextDeadline" in m) this.nd = m.nextDeadline;
      if (m.event === "roomCreated" || m.event === "joined") { this.id = m.playerId; this.token = m.token; if (m.roomCode) this.roomCode = m.roomCode; }
      if (m.event === "paired") { this.roomCode = m.roomCode; this.tvToken = m.tvToken; }
    }
    this.read = all.length;
  }
}
