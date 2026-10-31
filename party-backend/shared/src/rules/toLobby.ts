import type { GameState } from "./types";

// Back to the lobby: brackets cleared. keepHills (pause timeout) leaves each player's stored hill for display;
// the next startGame resets them anyway.
export function toLobby(s: GameState, keepHills: boolean): void {
  s.phase = "lobby";
  s.phaseId++;
  s.phaseEndsAt = 0;
  s.act = 0;
  s.round = 0;
  s.queue = [];
  s.matchNo = 0;
  s.results = [];
  s.byes = [];
  s.valley = { champion: [], comeback: [] };
  s.sat = [];
  s.usedPromptIds = [];
  delete s.match;
  delete s.finale;
  delete s.king;
  delete s.pausedAt;
  delete s.pausedUntil;
  for (const p of s.players) {
    delete p.pending;
    delete p.forfeited;
    if (!keepHills) p.hill = null;
  }
}
