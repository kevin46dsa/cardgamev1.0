import { GRACE_MS, HOST_AWAY_MS, type GameState } from "./types";
import { find, isActive } from "./util";

// Earliest ms timestamp at which calling advance could change something (phase end, contestant grace, host
// handoff, pause expiry), or null. Handlers/TV can arm one timer from this.
export function nextDeadline(s: GameState): number | null {
  const t: number[] = [];
  if (s.pausedUntil !== undefined) t.push(s.pausedUntil);
  else if (s.phaseEndsAt) t.push(s.phaseEndsAt);
  const live = s.match && s.pausedAt === undefined && ["intro", "write", "vote", "tiebreak"].includes(s.phase);
  if (live && s.match) for (const id of [s.match.a, s.match.b]) { const p = find(s, id); if (p && !p.online && !p.left && !p.kicked && p.offlineSince !== undefined) t.push(p.offlineSince + GRACE_MS); }
  const h = find(s, s.hostId);
  if (h && !isActive(h) && !h.left && !h.kicked && h.offlineSince !== undefined) t.push(h.offlineSince + HOST_AWAY_MS);
  return t.length ? Math.min(...t) : null;
}
