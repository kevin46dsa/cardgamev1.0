import { beforeEach, describe, expect, test, vi } from "vitest";
import { checkEnd, checkRules } from "./testing/checks";
import { Game } from "./testing/game";

vi.mock("@party/shared/src/db", () => import("./testing/fakeDb"));

const budget: string[] = [];
const seen = new Set<string>();

async function play(n: number, mode: "tv" | "phone", rounds: number, seed: number) {
  const g = new Game({ n, mode, rounds, seed });
  await g.setup();
  await g.start();
  await g.run();
  checkEnd(g);
  checkRules(g);
  const matches = g.ref.view!.act >= 0 ? (await import("@party/shared/src/db").then((d) => d.getRoom<any>(g.host.roomCode))) : null;
  for (const l of g.w.sender.log) {
    const v = l.msg.view;
    if (v?.phase === "tiebreak") seen.add("tiebreak");
    if (v?.phase === "reveal") seen.add(`${v.match.result.outcome}/${v.match.result.reason}`);
    if (v?.match?.replay) seen.add("replay");
  }
  const total = g.w.sender.log.length;
  const mn = matches && matches.status === "active" ? matches.meta.matchNo : 0;
  budget.push(`${n} players, ${rounds} round(s), ${mode}: ${total} outbound messages, ${mn} matches (${(total / mn).toFixed(1)}/match), max frame ${Math.max(...g.w.sender.log.map((l) => l.bytes))} B`);
  return { g, total, mn };
}

describe("full games through the public handler", () => {
  for (const mode of ["tv", "phone"] as const)
    for (const n of [3, 4, 7, 10])
      for (const rounds of [1, 2])
        test(`${n} players, ${rounds} round(s), ${mode}`, async () => {
          await play(n, mode, rounds, n * 100 + rounds * 10 + (mode === "tv" ? 1 : 2));
        });

  test("phone-only mode never sends voteCount; TV mode does, to the TV only", async () => {
    const a = await play(7, "phone", 1, 5);
    expect(a.g.w.sender.events("voteCount")).toHaveLength(0);
    const b = await play(7, "tv", 1, 5);
    expect(b.g.w.sender.events("voteCount").length).toBeGreaterThan(0);
  });

  test("message budget: 10 players, 1 round, TV mode", async () => {
    const { total, mn } = await play(10, "tv", 1, 77);
    console.log(`MESSAGE BUDGET 10 players / 1 round / TV: ${total} outbound messages in ${mn} matches (${(total / mn).toFixed(1)} per match)`);
    expect(total).toBeLessThan(2500);
  });
});

test("the bots really hit ties, identical answers, replays and tiebreakers", () => {
  for (const k of ["tiebreak", "replay", "win/votes", "identical/identical", "win/tiebreaker"]) expect(seen, k).toContain(k);
});

test("the leak checks are not vacuous: a planted leak is caught", async () => {
  const g = new Game({ n: 4, mode: "phone", seed: 2 });
  await g.setup();
  await g.toWrite();
  const [a, b] = g.contestants;
  expect(() => checkRules(g)).not.toThrow();
  g.w.sender.log.push({ seq: 9999, to: b!.conn, bytes: 10, msg: { event: "state", serverNow: 1, nextDeadline: 1, view: { phase: "write", match: { note: "ans P1" } } } });
  g.texts.set("ans P1", a!.name);
  expect(() => checkRules(g)).toThrow(/leaked/);
});

test.runIf(process.env.PRINT_BUDGET)("print budget table", () => console.log(budget.join("\n")));
