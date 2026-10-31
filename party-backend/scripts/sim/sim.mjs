// Full-game simulation over the LIVE socket. `node scripts/sim/sim.mjs [--players 3,5] [--odd champion,comeback] [--tv] [--seed N]`
// Plays one game per configuration, strictly sequentially (the account's Lambda concurrency limit is 10), checks invariants,
// prints a table and exits non-zero if any invariant failed. Default: players 3..10, both oddPlayerStart settings for odd counts,
// plus one TV-mode game (4 players).
import { Bot, FAST_SETTINGS, WS_URL, endRoom, joinAll, rng, sleep } from "./bot.mjs";

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? dflt : process.argv[i + 1];
};
const PLAYER_COUNTS = (arg("players", "3,4,5,6,7,8,9,10")).split(",").map(Number);
const ODD_STARTS = arg("odd", "champion,comeback").split(",");
const SEED = Number(arg("seed", "1"));
const GAME_TIMEOUT_MS = 15 * 60_000;
const FRAMES_PER_PLAYER_PER_MATCH_BUDGET = 14; // observed ~8-10; fail well above
const TYPING_EVENTS = ["typing", "typed", "keystroke"];

const configs = [];
for (const n of PLAYER_COUNTS) for (const odd of n % 2 ? ODD_STARTS : ["champion"]) configs.push({ n, odd, mode: "phone" });
if (process.argv.includes("--tv") || !process.argv.includes("--players")) configs.push({ n: 4, odd: "champion", mode: "tv" });

/** Returns a list of invariant violations for a finished game. */
function verify(bots, tv, cfg) {
  const bad = [];
  const phones = bots;
  const all = tv ? [...phones, tv] : phones;
  for (const b of all) {
    for (const { m } of b.frames) {
      if (m.event === "error") bad.push(`${b.label}: error frame ${m.code}`);
      if (TYPING_EVENTS.includes(m.event)) bad.push(`${b.label}: typing event`);
    }
  }
  // exactly one king, same for everybody
  const finals = all.map((b) => b.view);
  const kings = new Set(finals.map((v) => v?.king));
  if (finals.some((v) => v?.phase !== "final")) bad.push("not everyone ended in phase final");
  if (kings.size !== 1 || !kings.values().next().value) bad.push(`kings disagree/missing: ${[...kings].join(",")}`);
  const kingId = [...kings][0];
  if (!phones[0].view.players.some((p) => p.id === kingId)) bad.push("king is not a player");
  const sig = (v) => JSON.stringify({ k: v.king, f: v.finale, p: v.players.map((p) => [p.id, p.hill]) });
  if (new Set(finals.map(sig)).size !== 1) bad.push("final state differs between clients");
  // secrecy: a player's answer reaches others only in vote/tiebreak/reveal views
  const owners = phones.flatMap((b) => b.answers.map((a) => ({ who: b, text: a.text })));
  for (const b of all) {
    for (const { m, raw } of b.frames) {
      const late = ["state", "reveal", "snapshot"].includes(m.event) && ["vote", "tiebreak", "reveal"].includes(m.view?.phase);
      if (late) continue;
      for (const o of owners) if (o.who !== b && raw.includes(o.text)) bad.push(`LEAK: ${b.label} received ${o.who.label}'s answer in ${m.event}/${m.view?.phase ?? "-"}`);
    }
  }
  // authors only at reveal
  for (const b of all) for (const { m } of b.frames) if (m.view?.match?.authors && m.view.phase !== "reveal") bad.push(`${b.label}: authors outside reveal`);
  // voteCount: TV only, TV mode only
  for (const b of phones) if (b.frames.some(({ m }) => m.event === "voteCount")) bad.push(`${b.label}: phone received voteCount`);
  if (cfg.mode === "phone" && tv) bad.push("tv in phone mode");
  if (cfg.mode === "tv" && !tv.frames.some(({ m }) => m.event === "voteCount")) bad.push("TV never received voteCount in TV mode");
  // one match at a time: every client saw the same number of matches' prompts
  const n = Math.max(...phones.map((b) => b.matches.size));
  const budget = FRAMES_PER_PLAYER_PER_MATCH_BUDGET * cfg.n * n;
  const frames = all.reduce((s, b) => s + b.frames.length, 0);
  if (frames > budget) bad.push(`message budget exceeded: ${frames} > ${budget}`);
  return { bad, matches: n, frames, bytes: all.reduce((s, b) => s + b.frames.reduce((x, f) => x + f.raw.length, 0), 0) };
}

async function playGame(cfg, idx) {
  const random = rng(SEED * 1000 + idx);
  const tag = Math.random().toString(36).slice(2, 5).toUpperCase();
  const mk = (i) => new Bot(`B${cfg.n}${cfg.odd[0]}${i}${tag}`.slice(0, 12), { random: rng(SEED * 1000 + idx * 20 + i) });
  const bots = Array.from({ length: cfg.n }, (_, i) => mk(i));
  const tv = cfg.mode === "tv" ? new Bot(`TV${tag}`, { tv: true, autoplay: false }) : null;
  const t0 = Date.now();
  const host = bots[0];
  try {
    await host.connect();
    let pair;
    if (tv) { await tv.connect(); pair = await tv.tvPair(); }
    const roomCode = await host.createRoom({ ...FAST_SETTINGS, rounds: 1, oddPlayerStart: cfg.odd }, { mode: cfg.mode, pairCode: pair });
    if (tv) await tv.waitEvent("paired");
    await joinAll(bots.slice(1), roomCode);
    await sleep(500);
    host.start();
    await Promise.all([...bots, ...(tv ? [tv] : [])].map((b) => b.waitPhase("final", GAME_TIMEOUT_MS)));
    const res = verify(bots, tv, cfg);
    await sleep(300);
    // cleanup: end game (-> lobby), end again (closes the room), everyone must be told
    host.send({ action: "endGame" });
    await host.waitPhase("lobby", 8000);
    host.send({ action: "endGame" });
    await Promise.all(bots.map((b) => b.waitEvent("roomEnded", 8000)));
    return { cfg, ok: res.bad.length === 0, ...res, secs: Math.round((Date.now() - t0) / 1000), roomCode, king: host.view.players.find((p) => p.id === host.view.king)?.name };
  } catch (e) {
    return { cfg, ok: false, bad: [e.message], matches: [...host.matches].length, frames: 0, bytes: 0, secs: Math.round((Date.now() - t0) / 1000) };
  } finally {
    for (const b of [...bots, tv].filter(Boolean)) b.close();
  }
}

console.log(`sim against ${WS_URL}, seed ${SEED}, ${configs.length} games, sequential`);
const rows = [];
for (const [i, cfg] of configs.entries()) {
  process.stdout.write(`> ${cfg.n} players, odd=${cfg.odd}, ${cfg.mode} ... `);
  const r = await playGame(cfg, i);
  console.log(r.ok ? `ok (${r.secs}s)` : `FAIL ${r.bad.slice(0, 3).join(" | ")}`);
  rows.push(r);
  await sleep(1000);
}
const pad = (s, n) => String(s).padEnd(n);
console.log("\n" + ["players", "odd", "mode", "matches", "frames", "KB", "secs", "king", "result"].map((h, i) => pad(h, [8, 10, 6, 8, 7, 6, 6, 14, 6][i])).join(""));
for (const r of rows) console.log([r.cfg.n, r.cfg.odd, r.cfg.mode, r.matches, r.frames, (r.bytes / 1024).toFixed(0), r.secs, r.king ?? "-", r.ok ? "PASS" : "FAIL"].map((c, i) => pad(c, [8, 10, 6, 8, 7, 6, 6, 14, 6][i])).join(""));
const failed = rows.filter((r) => !r.ok);
for (const r of failed) console.log(`\nFAIL ${r.cfg.n}/${r.cfg.odd}/${r.cfg.mode}:\n  ` + [...new Set(r.bad)].slice(0, 10).join("\n  "));
console.log(`\n${rows.length - failed.length}/${rows.length} games passed`);
process.exit(failed.length ? 1 : 0);
