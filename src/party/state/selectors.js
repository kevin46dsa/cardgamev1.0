import { CONTESTANT_ROLES, KIND_LABELS, MIN_PLAYERS } from "../config";

/** @returns {string} display name for a player id */
export const nameOf = (view, id) => view?.players.find((p) => p.id === id)?.name ?? "Someone";
/** @returns {number} index of the player in the roster (for avatar colour) */
export const indexOf = (view, id) => Math.max(0, view?.players.findIndex((p) => p.id === id) ?? 0);
export const isContestant = (view) => CONTESTANT_ROLES.includes(view?.you?.role);
export const isHost = (view) => !!view?.you?.isHost;
export const onlineCount = (view) => view?.players.filter((p) => p.online).length ?? 0;
export const canStart = (view) => onlineCount(view) >= MIN_PLAYERS;
export const kindLabel = (kind) => KIND_LABELS[kind] ?? "Match";
/** @returns {boolean} true when this client is responsible for sending `advance` on time */
export const isDriver = (kind, view) => kind === "tv" || isHost(view);
/** @returns {boolean} phone-only rooms render the TV views on the phone */
export const isPhoneOnly = (view) => view?.mode === "phone";

/** Short role explanation shown to players who are not writing. */
const ROLE_NOTICES = {
  bye: { title: "You get a bye", body: "No match for you this time. You can still vote." },
  sitsOut: { title: "You sit out this round", body: "Your hill has an odd number of players. Watch and vote." },
  valley: { title: "You are in the Valley", body: "Win to join the Champion Hill. Lose and you head to Comeback." },
  fateDecider: { title: "You are the fate decider", body: "You are playing for fun. Nothing changes for you." },
  lastChance: { title: "Last Chance", body: "Win this to grab the last Finale spot." },
};
/** @returns {{title: string, body: string}|null} */
export const roleNotice = (view) => ROLE_NOTICES[view?.you?.role] ?? null;

/** @returns {string[]} opponent ids for a contestant, or [] */
export const opponents = (view) => (view?.match?.contestants ?? []).filter((id) => id !== view?.you?.id);

/** Plain-text summary of the reveal result for announcements and phones. */
export function resultLine(view) {
  const r = view?.match?.result;
  if (!r) return "";
  if (r.outcome === "win") return `${nameOf(view, r.winner)} wins`;
  if (r.outcome === "forfeit") return `${nameOf(view, r.winner)} wins by default`;
  if (r.outcome === "identical") return "Great minds think alike";
  return "It's a tie";
}
