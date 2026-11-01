import { roomPk } from "./keys";
import { queryPrefix } from "./query";

export async function listVotes(code: string, matchNo: number): Promise<{ voterId: string; side: "A" | "B" }[]> {
  const items = await queryPrefix(roomPk(code), `VOTE#${matchNo}#`);
  return items.map((i) => ({ voterId: i.voterId, side: i.side }));
}
