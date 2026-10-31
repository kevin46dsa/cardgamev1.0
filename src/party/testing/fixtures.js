/** Minimal wire views for tests. */
export const PLAYERS = [
  { id: "p1", name: "Maya", hill: null, online: true, host: true },
  { id: "p2", name: "Dev", hill: null, online: true, host: false },
  { id: "p3", name: "Sam", hill: null, online: true, host: false },
];

export const SETTINGS = { writeSecs: 45, voteSecs: 15, profanity: true, rounds: 1, oddPlayerStart: "champion" };

/**
 * @param {object} [o] overrides merged over a lobby view for player p1 (host)
 */
export function makeView(o = {}) {
  return {
    code: "KQXM",
    mode: "phone",
    hostId: "p1",
    settings: SETTINGS,
    estimatedMinutes: 10,
    phase: "lobby",
    phaseId: 0,
    endsAt: 0,
    act: 0,
    round: 0,
    rounds: 1,
    players: PLAYERS,
    hills: { champion: [], comeback: [], valley: { champion: [], comeback: [] }, sitsOut: [] },
    you: { id: "p1", role: "crowd", status: "playing", forfeited: false, hill: null, isHost: true },
    ...o,
  };
}

export const makeMatch = (o = {}) => ({
  n: 1, kind: "preliminary", promptId: "q1", prompt: "A fancy hotel for chickens", contestants: ["p2", "p3"],
  stakes: { p2: true, p3: true }, replay: 0, ...o,
});
