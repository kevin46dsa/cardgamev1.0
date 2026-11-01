// Thin typed wrapper over the Node bots used by the backend simulation (party-backend/scripts/sim/bot.mjs).
// Bots fill rooms and play opponents over the live socket so the UI under test only needs one or two real browsers.
// @ts-ignore plain ESM, no types
import * as sim from "../../../party-backend/scripts/sim/bot.mjs";

export interface BotLike {
  label: string;
  session: { roomCode?: string; playerId?: string; token?: string; tvToken?: string } | null;
  view: any;
  frames: { at: number; m: any; raw: string }[];
  connect(): Promise<BotLike>;
  createRoom(settings?: object, o?: { mode?: string; pairCode?: string }): Promise<string>;
  join(code: string): Promise<void>;
  start(): void;
  leave(): void;
  close(): void;
  send(o: object): void;
  waitEvent(event: string, ms?: number, opts?: object): Promise<any>;
  waitPhase(phase: string, ms?: number, opts?: object): Promise<any>;
  waitError(code: string, ms?: number): Promise<any>;
  autoplay: boolean;
  driveAdvance: boolean;
}

export const Bot: new (label: string, o?: object) => BotLike = sim.Bot;
export const endRoom: (host: BotLike, others?: BotLike[]) => Promise<void> = sim.endRoom;
export const joinAll: (bots: BotLike[], code: string) => Promise<void> = sim.joinAll;

/** Unique, <=12 char, name filter safe: "<prefix><3 random letters>". */
export function botName(prefix: string): string {
  const tag = Math.random().toString(36).replace(/[^a-z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  return `${prefix}${tag}`.slice(0, 12);
}
