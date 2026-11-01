import { mergeSettings } from "./settings";
import type { GameState, Res, Settings } from "./types";
import { clone } from "./util";

export function updateSettings(state: GameState, byId: string, patch: Partial<Settings>): Res {
  if (byId !== state.hostId) return { error: "NOT_HOST" };
  if (state.phase !== "lobby") return { error: "GAME_STARTED" };
  const settings = mergeSettings(state.settings, patch);
  if (!settings) return { error: "BAD_REQUEST" };
  const s = clone(state);
  s.settings = settings;
  return { state: s, events: [{ type: "settings", settings }] };
}
