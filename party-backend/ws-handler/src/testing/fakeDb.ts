// In-memory stand-in for @party/shared/src/db (swap it in with vi.mock). Same exported functions, same semantics:
// META version conditions, ENDED tombstone (version 0), conditional creates, CONN# lookup, conditional clearConnection.
// TTLs are ignored except for pair codes (10 min, judged against `clock`). Rate windows use `clock` too.
import type { Player, Tv } from "@party/shared/src/db/types";

export { newPlayerToken, hashToken, verifyToken } from "@party/shared/src/db/tokens";
export { ALPHABET, generateRoomCode, normalizeCode } from "@party/shared/src/db/roomCode";
export * from "@party/shared/src/db/keys";
export type { Player, Tv };

export const clock = { now: (): number => Date.now() };
export { IDLE_TTL, ENDED_TTL, ITEM_TTL, PAIR_TTL } from "@party/shared/src/db/ttl";
export const nowSec = () => Math.floor(clock.now() / 1000);
export const ttlIn = (s: number) => nowSec() + s;
export const calls = { n: 0 }; // rough DynamoDB-op counter for the cost report

type Item = Record<string, any>;
const items = new Map<string, Item>();
export const resetDb = () => { items.clear(); counters.clear(); calls.n = 0; };
const counters = new Map<string, number>();
const k = (pk: string, sk: string) => `${pk}\u0000${sk}`;
const get = (pk: string, sk: string) => (calls.n++, items.get(k(pk, sk)));
const put = (pk: string, sk: string, v: Item) => { calls.n++; items.set(k(pk, sk), { ...structuredClone(v), pk, sk }); };
const prefix = (pk: string, p: string) => (calls.n++, [...items.values()].filter((i) => i.pk === pk && i.sk.startsWith(p)).map((i) => structuredClone(i)));
const strip = ({ pk, sk, ...rest }: Item) => rest;
const pk = (code: string) => `ROOM#${code}`;

export async function createRoom(code: string, meta: unknown): Promise<boolean> {
  if (get(pk(code), "META")) return false;
  put(pk(code), "META", { status: "active", meta, version: 1 });
  for (const i of [...items.values()]) if (i.pk === pk(code) && i.sk !== "META") items.delete(k(i.pk, i.sk));
  return true;
}
export async function clearLeftovers(code: string): Promise<void> {
  for (const i of [...items.values()]) if (i.pk === pk(code) && i.sk !== "META") items.delete(k(i.pk, i.sk));
}
export async function getRoom<T>(code: string) {
  const i = get(pk(code), "META");
  if (!i) return null;
  return i.status === "ended" ? ({ status: "ended" } as const) : ({ status: "active", meta: structuredClone(i.meta) as T, version: i.version as number } as const);
}
export async function saveRoom(code: string, meta: unknown, expectedVersion: number): Promise<boolean> {
  const i = get(pk(code), "META");
  if (!i || i.status !== "active" || i.version !== expectedVersion) return false;
  put(pk(code), "META", { status: "active", meta, version: expectedVersion + 1 });
  return true;
}
export type RoomResult<T> = { ok: true; meta: T } | { error: string };
export const hooks = { beforeSave: undefined as undefined | (() => void | Promise<void>) }; // tests use this to force a version conflict (or a crash)
export async function withRoom<T>(code: string, fn: (meta: T) => T | { error: string }): Promise<RoomResult<T>> {
  for (let i = 0; i < 5; i++) {
    const room = await getRoom<T>(code);
    if (!room) return { error: "ROOM_NOT_FOUND" };
    if (room.status === "ended") return { error: "ROOM_ENDED" };
    const next = fn(room.meta);
    if (next && typeof next === "object" && typeof (next as { error?: unknown }).error === "string") return next as { error: string };
    await hooks.beforeSave?.();
    if (await saveRoom(code, next, room.version)) return { ok: true, meta: next as T };
  }
  return { error: "CONFLICT" };
}
export async function endRoom(code: string): Promise<void> { put(pk(code), "META", { status: "ended", version: 0 }); }
export async function touchRoom(code: string): Promise<boolean> {
  const i = get(pk(code), "META");
  return !!i && i.status === "active";
}

export async function putPlayer(code: string, id: string, p: Player): Promise<void> { put(pk(code), `PLAYER#${id}`, p); }
export async function getPlayer(code: string, id: string): Promise<Player | null> {
  const i = get(pk(code), `PLAYER#${id}`);
  return i ? (strip(structuredClone(i)) as Player) : null;
}
export async function listPlayers(code: string): Promise<(Player & { playerId: string })[]> {
  return prefix(pk(code), "PLAYER#").map((i) => ({ ...strip(i), playerId: i.sk.slice(7) }) as Player & { playerId: string });
}
export async function setConnection(code: string, id: string, connectionId: string): Promise<boolean> {
  const i = get(pk(code), `PLAYER#${id}`);
  if (!i) return false;
  put(pk(code), `PLAYER#${id}`, { ...i, connectionId, online: true, offlineSince: undefined });
  put(`CONN#${connectionId}`, "CONN", { code, playerId: id });
  return true;
}
export async function clearConnection(code: string, id: string, connectionId: string, now = clock.now()): Promise<boolean> {
  const i = get(pk(code), `PLAYER#${id}`);
  items.delete(k(`CONN#${connectionId}`, "CONN"));
  if (!i || i.connectionId !== connectionId) return false;
  const { connectionId: _c, ...rest } = i;
  put(pk(code), `PLAYER#${id}`, { ...rest, online: false, offlineSince: now });
  return true;
}
export async function findByConnection(connectionId: string): Promise<{ code: string; playerId: string | null } | null> {
  const i = get(`CONN#${connectionId}`, "CONN");
  return i ? { code: i.code, playerId: i.playerId ?? null } : null;
}

export async function putTv(code: string, tv: Tv): Promise<void> { put(pk(code), "TV", tv); }
export async function getTv(code: string): Promise<Tv | null> {
  const i = get(pk(code), "TV");
  return i ? (strip(structuredClone(i)) as Tv) : null;
}
export async function clearTvConnection(code: string, connectionId: string): Promise<boolean> {
  const i = get(pk(code), "TV");
  items.delete(k(`CONN#${connectionId}`, "CONN"));
  if (!i || i.connectionId !== connectionId) return false;
  const { connectionId: _c, ...rest } = i;
  put(pk(code), "TV", rest);
  return true;
}
export async function setTvConnection(code: string, connectionId: string): Promise<boolean> {
  const i = get(pk(code), "TV");
  if (!i) return false;
  put(pk(code), "TV", { ...i, connectionId });
  put(`CONN#${connectionId}`, "CONN", { code, playerId: null });
  return true;
}

export async function putAnswer(code: string, match: number, playerId: string, text: string, now = clock.now()): Promise<void> {
  put(pk(code), `ANSWER#${match}#${playerId}`, { playerId, text, submittedAt: now });
}
export async function listAnswers(code: string, match: number) {
  return prefix(pk(code), `ANSWER#${match}#`).map((i) => ({ playerId: i.playerId as string, text: i.text as string, submittedAt: i.submittedAt as number }));
}
export async function putVote(code: string, match: number, voterId: string, side: "A" | "B"): Promise<void> {
  put(pk(code), `VOTE#${match}#${voterId}`, { voterId, side });
}
export async function listVotes(code: string, match: number) {
  return prefix(pk(code), `VOTE#${match}#`).map((i) => ({ voterId: i.voterId as string, side: i.side as "A" | "B" }));
}

const live = (i?: Item) => !!i && i.ttl > nowSec();
export async function createPairCode(tvConnectionId: string, rng: () => number = Math.random): Promise<string | null> {
  for (let n = 0; n < 10; n++) {
    const c = String(Math.floor(rng() * 10000)).padStart(4, "0");
    if (live(get(`PAIR#${c}`, "PAIR"))) continue;
    put(`PAIR#${c}`, "PAIR", { tvConnectionId, ttl: ttlIn(600) });
    return c;
  }
  return null;
}
export async function bindPairCode(code4: string, roomCode: string): Promise<string | null> {
  const i = get(`PAIR#${code4}`, "PAIR");
  if (!live(i)) return null;
  put(`PAIR#${code4}`, "PAIR", { ...i, roomCode });
  return i!.tvConnectionId;
}
export async function getPairCode(code4: string): Promise<{ tvConnectionId: string; roomCode?: string } | null> {
  const i = get(`PAIR#${code4}`, "PAIR");
  return live(i) ? { tvConnectionId: i!.tvConnectionId, roomCode: i!.roomCode } : null;
}
export async function deletePairCode(code4: string): Promise<void> { calls.n++; items.delete(k(`PAIR#${code4}`, "PAIR")); }

export async function hit(key: string, windowSeconds: number, limit: number): Promise<{ allowed: boolean; count: number }> {
  calls.n++;
  const id = `${key}|${Math.floor(nowSec() / windowSeconds)}`;
  const count = (counters.get(id) ?? 0) + 1;
  counters.set(id, count);
  return { allowed: count <= limit, count };
}
export async function peekHits(key: string, windowSeconds: number): Promise<number> {
  calls.n++;
  return counters.get(`${key}|${Math.floor(nowSec() / windowSeconds)}`) ?? 0;
}
