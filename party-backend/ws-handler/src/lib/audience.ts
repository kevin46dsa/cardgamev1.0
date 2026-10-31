import { getTv, listPlayers } from "@party/shared/src/db";

// Who is connected right now: playerId -> connectionId (only players with a socket) and the TV's socket.
export async function audience(code: string): Promise<{ players: Map<string, string>; tv?: string }> {
  const [list, tv] = await Promise.all([listPlayers(code), getTv(code)]);
  const players = new Map<string, string>();
  for (const p of list) if (p.connectionId) players.set(p.playerId, p.connectionId);
  return { players, tv: tv?.connectionId };
}
