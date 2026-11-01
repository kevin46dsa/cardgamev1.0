import { roomPk } from "./keys";
import { queryPrefix } from "./query";

export async function listAnswers(code: string, matchNo: number): Promise<{ playerId: string; text: string; submittedAt: number }[]> {
  const items = await queryPrefix(roomPk(code), `ANSWER#${matchNo}#`);
  return items.map((i) => ({ playerId: i.playerId, text: i.text, submittedAt: i.submittedAt }));
}
