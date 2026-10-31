import { DEFAULT_SETTINGS } from "./settings";
import type { GameState, Mode, Settings } from "./types";

// New room with the host as first player. `settings` is assumed validated (see updateSettings).
export function createLobby(code: string, hostId: string, hostName: string, settings: Partial<Settings>, mode: Mode, now: number): GameState {
  return {
    code, mode, hostId, settings: { ...DEFAULT_SETTINGS, ...settings },
    players: [{ id: hostId, name: hostName.trim(), hill: null, online: true, connectedAt: now }],
    phase: "lobby", phaseId: 0, phaseEndsAt: 0, act: 0, round: 0, queue: [], matchNo: 0, results: [], byes: [],
    valley: { champion: [], comeback: [] }, sat: [], usedPromptIds: [],
  };
}
