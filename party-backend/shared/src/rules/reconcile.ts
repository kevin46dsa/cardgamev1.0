import { forfeitAbsent, type Ctx } from "./match";
import { toLobby } from "./toLobby";
import { type EngineEvent, type GameState, type Ok, HOST_AWAY_MS, MIN_PLAYERS, PAUSE_MS } from "./types";
import { find, isActive } from "./util";

// Applies everything that depends only on who is connected and what time it is: host handoff, pause / resume /
// back-to-lobby, contestant forfeits. Mutates s.
export function reconcile(s: GameState, c: Ctx, events: EngineEvent[]): void {
  const { now } = c;
  const host = find(s, s.hostId);
  if (!host || !isActive(host)) {
    const gone = !host || host.left || host.kicked || now - (host.offlineSince ?? now) >= HOST_AWAY_MS;
    const next = gone ? s.players.filter(isActive).sort((a, b) => a.connectedAt - b.connectedAt)[0] : undefined;
    if (next) {
      s.hostId = next.id;
      events.push({ type: "hostChanged", hostId: next.id });
    }
  }
  if (s.phase !== "lobby" && s.phase !== "final") {
    const n = s.players.filter(isActive).length;
    if (s.pausedAt === undefined) {
      if (n < MIN_PLAYERS) {
        s.pausedAt = now;
        s.pausedUntil = now + PAUSE_MS;
        events.push({ type: "paused", until: s.pausedUntil });
      }
    } else if (n >= MIN_PLAYERS) {
      if (s.phaseEndsAt > 0) s.phaseEndsAt += now - s.pausedAt;
      for (const p of s.players) if (!p.online) p.offlineSince = now; // fresh grace
      delete s.pausedAt;
      delete s.pausedUntil;
      events.push({ type: "resumed", endsAt: s.phaseEndsAt });
    } else if (now >= (s.pausedUntil ?? now)) {
      toLobby(s, true);
      events.push({ type: "lobby", reason: "paused" });
    }
  }
  forfeitAbsent(s, c, events);
}

// Shared tail of the lobby/player functions.
export function finish(s: GameState, c: Ctx, events: EngineEvent[]): Ok {
  reconcile(s, c, events);
  return { state: s, events };
}
