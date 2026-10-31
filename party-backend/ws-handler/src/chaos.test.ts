import { expect, test, vi } from "vitest";
import * as db from "./testing/fakeDb";
import { checkEnd, checkRules } from "./testing/checks";
import { Bot } from "./testing/bot";
import { Game } from "./testing/game";

vi.mock("@party/shared/src/db", () => import("./testing/fakeDb"));

const room = async (g: Game) => ((await db.getRoom<any>(g.host.roomCode)) as { meta: any }).meta;

// Nobody may receive a view after being kicked; nothing at all after leaving (until they rejoin).
function checkRemoved(g: Game, b: Bot, event: "kicked" | "left") {
  const all = g.w.sender.log.filter((l) => g.w.owners.get(l.to) === b.name);
  const i = all.findIndex((l) => l.msg.event === event);
  expect(i, `${b.name} got ${event}`).toBeGreaterThanOrEqual(0);
  const rejoined = all.slice(i + 1).findIndex((l) => l.msg.event === "snapshot");
  const after = (rejoined < 0 ? all.slice(i + 1) : all.slice(i + 1, i + 1 + rejoined)).filter((l) => l.msg.event !== "error");
  expect(after.map((l) => l.msg.event), `${b.name} after ${event}`).toEqual([]);
}

test("contestant offline past 15 s forfeits and the game still finishes with one King (phone, 5)", async () => {
  const g = new Game({ n: 5, mode: "phone", seed: 11 });
  await g.setup();
  await g.toWrite();
  const c = g.contestants.find((b) => b !== g.host)!;
  const opp = g.contestants.find((b) => b !== c)!;
  await g.drop(c);
  g.w.clock.t += 15_000;
  await g.ref.send({ action: "advance", phaseId: g.ref.view!.phaseId });
  g.sync();
  expect(opp.view!.match!.result).toMatchObject({ outcome: "forfeit", winner: opp.id });
  await g.rejoin(c);
  expect(c.view!.you).toMatchObject({ forfeited: true });
  await g.run();
  checkEnd(g);
  checkRules(g);
});

test("a player who left (or dropped) in Act 2 comes back to their stored hill before the Finale", async () => {
  for (const how of ["leave", "drop"] as const) {
    const g = new Game({ n: 8, mode: "tv", seed: 21 });
    await g.setup();
    await g.start();
    while (g.ref.view!.act < 2) await g.step();
    const x = g.crowd.find((b) => b !== g.host && b.view!.you!.hill)!;
    const hill = x.view!.you!.hill;
    if (how === "leave") await x.send({ action: "leaveRoom" });
    else await g.drop(x);
    g.down.add(x);
    await g.step();
    await g.rejoin(x);
    expect(x.view!.you!.hill, how).toBe(hill);
    expect(x.view!.you!.status).toBe(how === "leave" ? "returning" : "playing"); // a plain drop just carries on
    await g.run();
    checkEnd(g);
    expect(g.w.sender.log.filter((l) => l.msg.event === "error" && g.w.owners.get(l.to) !== x.name)).toEqual([]);
    expect(x.view!.you!.hill ?? hill).toBeTruthy();
  }
});

test("host drops for 30 s: handoff; the old host comes back as a normal player; game ends with one King", async () => {
  const g = new Game({ n: 6, mode: "tv", seed: 31 });
  await g.setup();
  await g.start();
  for (let i = 0; i < 3; i++) await g.step();
  const oldHost = g.host;
  await g.drop(oldHost);
  g.w.clock.t += 31_000;
  await g.tv!.send({ action: "advance", phaseId: g.tv!.view!.phaseId });
  g.sync();
  const newHost = g.tv!.view!.hostId;
  expect(newHost).not.toBe(oldHost.id);
  await g.rejoin(oldHost);
  expect(oldHost.view!.hostId).toBe(newHost);
  expect(oldHost.view!.you!.isHost).toBe(false);
  await g.run();
  checkEnd(g);
  checkRules(g);
});

test("kick, leave and a late join in the middle of a game", async () => {
  const g = new Game({ n: 7, mode: "phone", seed: 41 });
  await g.setup();
  await g.start();
  for (let i = 0; i < 4; i++) await g.step();
  const [, a, b] = g.bots as [Bot, Bot, Bot];
  await g.host.send({ action: "kickPlayer", playerId: a.id });
  g.down.add(a);
  await b.send({ action: "leaveRoom" });
  g.down.add(b);
  const late = await g.join("Late");
  for (let i = 0; i < 3; i++) await g.step();
  expect(late.view!.you!.status).toBe("late");
  await g.run();
  checkEnd(g);
  checkRules(g);
  checkRemoved(g, a, "kicked");
  checkRemoved(g, b, "left");
  expect(late.view!.phase).toBe("final");
  // the kicked player is refused for good
  await g.rejoin(a);
  expect(a.errors().at(-1)).toBe("KICKED");
});

test("chaos: random drops, comebacks, kicks and joins across seeds always end with exactly one King", async () => {
  for (let seed = 1; seed <= 12; seed++) {
    const mode = seed % 2 ? "tv" : "phone";
    const g = new Game({ n: 8, mode, seed, pAnswer: 0.8, pVote: 0.9 });
    await g.setup();
    await g.start();
    const back = new Map<Bot, number>();
    let kicked = 0, joined = 0;
    for (let i = 0; i < 3000 && g.ref.view!.phase !== "final"; i++) {
      for (const [b, at] of back) if (i >= at) { await g.rejoin(b); back.delete(b); }
      const r = g.rand();
      const up = g.bots.filter((b) => !g.down.has(b) && b !== g.host);
      if (r < 0.08 && back.size < 2 && up.length > 5) {
        const b = up[Math.floor(g.rand() * up.length)]!;
        await g.drop(b);
        back.set(b, i + 1 + Math.floor(g.rand() * 8));
      } else if (r < 0.1 && kicked < 1 && up.length > 5) {
        const b = up[Math.floor(g.rand() * up.length)]!;
        await g.host.send({ action: "kickPlayer", playerId: b.id });
        g.down.add(b);
        kicked++;
      } else if (r < 0.12 && joined < 2 && g.bots.length < 10) {
        const l = await g.join(`L${++joined}`);
        if (!l.view) g.down.add(l); // refused (e.g. the Finale already started)
      }
      await g.step();
    }
    for (const [b] of back) await g.rejoin(b);
    expect(g.ref.view!.phase, `seed ${seed}`).toBe("final");
    g.sync();
    checkEnd(g);
    const meta = await room(g);
    expect(meta.king, `seed ${seed}`).toBeDefined();
    // no secrets leaked, whatever the chaos (errors are allowed here: kicked / just-dropped players act late)
    const errs = g.w.sender.log.filter((l) => l.msg.event === "error");
    g.w.sender.log = g.w.sender.log.filter((l) => l.msg.event !== "error");
    checkRules(g);
    expect(errs.every((l) => ["WRONG_PHASE", "NOT_CONTESTANT", "CONTESTANT_CANNOT_VOTE", "BAD_REQUEST", "KICKED", "NAME_TAKEN", "FINALE_IN_PROGRESS"].includes(l.msg.code))).toBe(true);
  }
});
