// Live smoke test: npm run smoke  (WS_URL overrides the endpoint). Node 24, global WebSocket, no dependencies.
// Sequential and tiny on purpose: 3 sockets, ~15 invocations. The account Lambda concurrency limit is 10, shared with other apps.
// Flow: create room, 2 bots join, start, check every `state` role field, play the write phase and check that an answer never
// reaches anyone before the vote phase, then everyone leaves. Exit code 0 only if every check passed.
const URL = process.env.WS_URL ?? "wss://gamenight-ws.nosenterprise.org";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sockets = [];

function fail(msg) {
  throw new Error(msg);
}
function check(cond, msg) {
  if (!cond) fail(`check failed: ${msg}`);
  console.log(`ok   ${msg}`);
}

function open(label) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(URL);
    ws.label = label;
    ws.msgs = []; // every parsed frame, in order, as {at, m, raw}
    ws.onmessage = (e) => ws.msgs.push({ m: JSON.parse(e.data), raw: String(e.data) });
    ws.onopen = () => resolve(ws);
    ws.onerror = () => reject(new Error(`${label}: cannot connect to ${URL}`));
    sockets.push(ws);
  });
}
const send = (ws, o) => ws.send(JSON.stringify(o));

async function until(ws, pred, what, ms = 10000) {
  const end = Date.now() + ms;
  let seen = 0;
  while (Date.now() < end) {
    for (; seen < ws.msgs.length; seen++) {
      const { m } = ws.msgs[seen];
      if (m.event === "error") fail(`${ws.label}: server error ${m.code} ${m.message} while waiting for ${what}`);
      if (pred(m)) return m;
    }
    await sleep(50);
  }
  fail(`${ws.label}: timeout waiting for ${what}; got ${ws.msgs.map(({ m }) => m.event).join(",")}`);
}
const waitEvent = (ws, event, ms) => until(ws, (m) => m.event === event, event, ms);
const waitPhase = (ws, phase) => until(ws, (m) => (m.event === "state" || m.event === "reveal") && m.view?.phase === phase, `state phase=${phase}`);

async function main() {
  const host = await open("host");
  send(host, { action: "createRoom", name: "SmokeHost", mode: "phone", settings: { rounds: 1 } });
  const created = await waitEvent(host, "roomCreated");
  check(/^[A-Z]{4}$/.test(created.roomCode), `room created (${created.roomCode})`);

  const bots = [host];
  for (const name of ["SmokeAnn", "SmokeBob"]) {
    const ws = await open(name);
    send(ws, { action: "joinRoom", roomCode: created.roomCode, name });
    await waitEvent(ws, "joined");
    bots.push(ws);
  }
  check(bots.length === 3, "2 bots joined");

  send(host, { action: "startGame" });
  const states = [];
  for (const ws of bots) states.push(await waitPhase(ws, "intro"));
  const roles = states.map((s) => s.view.you?.role);
  check(roles.every((r) => ["contestant", "crowd", "bye"].includes(r)), `every bot got state.view.you.role (${roles.join(",")})`);
  check(roles.filter((r) => r === "contestant").length === 2, "exactly 2 contestants in the first match");
  check(states.every((s) => typeof s.view.match?.prompt === "string" && s.view.match.prompt.length > 0), "every state carries view.match.prompt");
  check(states.every((s) => typeof s.view.phaseId === "number" && typeof s.nextDeadline === "number" && typeof s.serverNow === "number"), "state has phaseId, nextDeadline, serverNow");

  // Wait for the intro deadline (server has no timer), then ask to advance.
  const intro = states[0];
  await sleep(Math.max(0, intro.nextDeadline - Date.now()) + 500);
  send(host, { action: "advance", phaseId: intro.view.phaseId });
  const writes = [];
  for (const ws of bots) writes.push(await waitPhase(ws, "write"));
  check(writes.every((s) => s.view.phaseId > intro.view.phaseId), "advance moved everyone to write");

  // Each contestant submits a unique marker. Until the vote phase it must appear in NO frame to anybody else.
  const marker = Object.fromEntries(bots.map((ws, i) => [i, `ZQXMARK${i}${Math.random().toString(36).slice(2, 8)}`]));
  const contestants = bots.map((ws, i) => i).filter((i) => roles[i] === "contestant");
  for (const i of contestants) send(bots[i], { action: "submitAnswer", text: marker[i] });
  const votes = [];
  for (const ws of bots) votes.push(await waitPhase(ws, "vote"));
  for (const i of contestants) await until(bots[i], (m) => m.event === "submitted", "submitted ack");

  for (const [wi, ws] of bots.entries()) {
    for (const { m, raw } of ws.msgs) {
      const inVotePhase = (m.event === "state" || m.event === "reveal") && ["vote", "tiebreak", "reveal"].includes(m.view?.phase);
      if (inVotePhase) continue;
      for (const [ci, text] of Object.entries(marker)) {
        if (Number(ci) === wi) continue;
        if (!contestants.includes(Number(ci))) continue;
        if (raw.includes(text)) fail(`leak: ${ws.label} got contestant ${ci}'s answer in a ${m.event}/${m.view?.phase} frame`);
      }
    }
  }
  check(true, "no frame leaked another player's answer before the vote phase");
  check(votes.every((s) => !JSON.stringify(s.view.match).includes('"authors"')), "vote phase does not reveal authors");

  for (const ws of bots) send(ws, { action: "leaveRoom" });
  for (const ws of bots) await waitEvent(ws, "left");
  check(true, "all bots left cleanly");
}

let code = 0;
try {
  await main();
  console.log("SMOKE PASS");
} catch (e) {
  console.error(`SMOKE FAIL: ${e.message}`);
  code = 1;
} finally {
  for (const ws of sockets) try { ws.close(); } catch {}
  await sleep(300);
  process.exit(code);
}
