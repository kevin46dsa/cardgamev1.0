import { expect } from "vitest";
import type { Game } from "./game";

// Everything the secrecy / cost rules say about what bots may have received.
export function checkRules(g: Game) {
  const log = g.w.sender.log;
  const tvConn = g.tv?.conn;
  expect(log.filter((l) => l.msg.event === "error"), "no error frames for valid play").toEqual([]);
  expect(log.some((l) => /typing/i.test(JSON.stringify(l.msg.event)))).toBe(false);
  for (const l of g.w.sender.events("voteCount")) {
    expect(l.to, "voteCount only to the TV").toBe(tvConn);
    expect(g.o.mode).toBe("tv");
  }
  const authorsOf = (m: any) => m.view?.match?.authors;
  for (const l of log) {
    const m = l.msg;
    const phase = m.view?.phase;
    expect(typeof m.serverNow).toBe("number");
    if (m.view) expect("nextDeadline" in m, `nextDeadline on ${m.event}`).toBe(true);
    if (authorsOf(m)) expect(phase, "authors only at reveal").toBe("reveal");
    expect(l.bytes, `${m.event} is ${l.bytes} bytes`).toBeLessThan(4096);
    // Answer text of ANOTHER bot only inside vote / tiebreak / reveal views. (Own text: only via yourAnswer.)
    const recipient = [...g.everyone].find((b) => b.conn === l.to)!;
    const body = JSON.stringify(m);
    for (const [text, author] of g.texts) {
      if (!body.includes(JSON.stringify(text).slice(1, -1))) continue;
      if (author === recipient.name) continue;
      expect(["vote", "tiebreak", "reveal"], `${author}'s text leaked to ${recipient.name} in ${m.event}/${phase}`).toContain(phase);
    }
    // submitted never carries text
    if (m.event === "submitted") expect(Object.keys(m).sort()).toEqual(["contestantId", "event", "serverNow"]);
  }
}

export function checkEnd(g: Game) {
  g.sync();
  const kings = new Set<string>();
  for (const b of g.everyone) {
    if (g.down.has(b)) continue;
    expect(b.view?.phase, `${b.name} final`).toBe("final");
    kings.add(b.view!.king!);
  }
  expect(kings.size, "one king, same for everyone").toBe(1);
  const ids = g.bots.map((b) => b.id);
  expect(ids).toContain([...kings][0]);
}
