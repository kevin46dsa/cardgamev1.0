import { getTv, listPlayers } from "@party/shared/src/db";
import type { GameState } from "@party/shared/src/rules";

// Who is connected right now: playerId -> connectionId (only players with a socket) and the TV's socket.
// With the room state, players who left or were kicked are left out (their old socket may still be open).
export async function audience(code: string, s?: GameState): Promise<{ players: Map<string, string>; tv?: string }> {
  const [list, tv] = await Promise.all([listPlayers(code), getTv(code)]);
  const gone = new Set(s?.players.filter((p) => p.left || p.kicked).map((p) => p.id));
  const players = new Map<string, string>();
  for (const p of list) if (p.connectionId && !gone.has(p.playerId)) players.set(p.playerId, p.connectionId);
  return { players, tv: tv?.connectionId };
}
