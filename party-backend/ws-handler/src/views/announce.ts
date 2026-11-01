import type { ServerEventBody } from "@party/shared/src/protocol";
import { nextDeadline, viewFor, type EngineEvent, type GameState } from "@party/shared/src/rules";
import type { Ctx } from "../lib/ctx";
import { audience } from "../lib/audience";
import { wireView } from "./wireView";

// Sends what an engine result means to each recipient, following the cost rules:
//  - a phase change (or return to the lobby) = ONE message per recipient with their own view
//  - roster/presence = TV + host + the current opponent only (everyone while in the lobby)
//  - rare events (hostChanged, paused, resumed, settings, kicked) go to everyone / the target
// `subject` = the player the event is about (for the opponent rule); `skip` = connections that get a snapshot instead.
export async function announce(ctx: Ctx, code: string, s: GameState, events: EngineEvent[], o: { subject?: string; skip?: string[] } = {}): Promise<void> {
  if (!events.length) return;
  const has = (t: EngineEvent["type"]) => events.some((e) => e.type === t);
  const a = await audience(code);
  const skip = new Set(o.skip);
  const nd = nextDeadline(s);
  const live = (id: string) => s.players.some((p) => p.id === id && !p.left && !p.kicked);
  const everyone = [...a.players].filter(([id]) => live(id)).map(([, c]) => c).concat(a.tv ? [a.tv] : []);
  const out: Promise<unknown>[] = [];
  const to = (conns: (string | undefined)[], body: ServerEventBody) => {
    for (const c of new Set(conns)) if (c && !skip.has(c)) out.push(ctx.send(c, body));
  };

  const kicked = events.find((e) => e.type === "kicked");
  if (kicked && kicked.type === "kicked") to([a.players.get(kicked.playerId)], { event: "kicked" });

  if (has("phaseChanged") || has("lobby")) {
    const hills = events.find((e) => e.type === "hills");
    const moves = hills && hills.type === "hills" ? hills.moves : undefined;
    const event = s.phase === "reveal" ? "reveal" : "state";
    const msg = (who: string): ServerEventBody => ({ event, view: wireView(s, who), nextDeadline: nd, ...(moves ? { moves } : {}) });
    for (const [id, c] of a.players) if (live(id)) to([c], msg(id));
    if (a.tv) to([a.tv], msg("tv"));
  } else if (has("players")) {
    const m = s.match;
    const opp = o.subject && m && s.phase !== "lobby" && (m.a === o.subject || m.b === o.subject) ? (m.a === o.subject ? m.b : m.a) : undefined;
    const rec = s.phase === "lobby" ? everyone : [a.tv, a.players.get(s.hostId), opp && a.players.get(opp)];
    to(rec, { event: "players", players: viewFor(s, "tv").players, hostId: s.hostId, nextDeadline: nd });
  }
  for (const e of events) {
    if (e.type === "hostChanged") to(everyone, { event: "hostChanged", hostId: e.hostId, nextDeadline: nd });
    else if (e.type === "paused") to(everyone, { event: "paused", until: e.until, nextDeadline: nd });
    else if (e.type === "resumed") to(everyone, { event: "resumed", endsAt: e.endsAt, nextDeadline: nd });
    else if (e.type === "settings") to(everyone, { event: "settings", settings: e.settings, estimatedMinutes: viewFor(s, "tv").estimatedMinutes });
  }
  await Promise.all(out);
}
