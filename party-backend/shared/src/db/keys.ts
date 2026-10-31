// Key shapes for the single PartyGames table. Pure string builders, one file because they are one-liners.
export const roomPk = (code: string) => `ROOM#${code}`;
export const META = "META";
export const TV = "TV";
export const playerSk = (id: string) => `PLAYER#${id}`;
export const answerSk = (match: number, playerId: string) => `ANSWER#${match}#${playerId}`;
export const voteSk = (match: number, voterId: string) => `VOTE#${match}#${voterId}`;
export const pairPk = (code4: string) => `PAIR#${code4}`;
export const PAIR = "PAIR";
export const ratePk = (key: string) => `RATE#${key}`;
