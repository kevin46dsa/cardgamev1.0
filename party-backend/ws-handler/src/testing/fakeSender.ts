import type { SendResult } from "../lib/send";

export interface Sent { seq: number; to: string; msg: any; bytes: number }

// Records every message per connection. A closed connection answers like API Gateway's 410.
export class FakeSender {
  log: Sent[] = [];
  closed = new Set<string>();
  async send(to: string, msg: unknown): Promise<SendResult> {
    if (this.closed.has(to)) return { gone: [to], failed: 0 };
    const data = JSON.stringify(msg);
    this.log.push({ seq: this.log.length, to, msg: JSON.parse(data), bytes: Buffer.byteLength(data) });
    return { gone: [], failed: 0 };
  }
  to(conn: string): any[] { return this.log.filter((l) => l.to === conn).map((l) => l.msg); }
  events(name: string): Sent[] { return this.log.filter((l) => l.msg.event === name); }
}
