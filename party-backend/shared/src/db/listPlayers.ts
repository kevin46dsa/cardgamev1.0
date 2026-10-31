import { roomPk } from "./keys";
import { queryPrefix } from "./query";
import type { Player } from "./types";

export async function listPlayers(code: string): Promise<(Player & { playerId: string })[]> {
  const items = await queryPrefix(roomPk(code), "PLAYER#");
  return items.map(({ pk, sk, ttl, ...p }) => ({ ...p, playerId: (sk as string).slice("PLAYER#".length) }) as Player & { playerId: string });
}
