import { pickByes } from "./pickByes";
import { shuffle } from "./rng";
import type { BatchResult, GameState, Rng } from "./types";
import { isActive, pairUp } from "./util";

// Finale start: active Champion-hill players. Odd (>1) and >= 2 comeback players: one Last Chance match first.
// ponytail: if no active champions at all (chaos only) every active player is a finalist.
export function startFinale(s: GameState, rng: Rng): void {
  s.sat = [];
  const act = s.players.filter(isActive);
  let alive = act.filter((p) => p.hill === "champion").map((p) => p.id);
  if (!alive.length) alive = act.map((p) => p.id);
  const comeback = act.filter((p) => p.hill === "comeback" && !alive.includes(p.id)).map((p) => p.id);
  s.finale = { stage: "bracket", alive, rounds: [] };
  if (alive.length > 1 && alive.length % 2 && comeback.length >= 2) {
    const [a, b] = shuffle(comeback, rng) as [string, string];
    s.finale.stage = "lastChance";
    s.finale.lc = { a, b };
    s.queue = [{ kind: "lastChance", a, b }];
  } else planRound(s, rng);
}

// After a Finale batch (Last Chance or a bracket round): record winners, plan the next round or crown the king.
export function nextFinale(s: GameState, res: BatchResult[], rng: Rng): void {
  const f = s.finale;
  if (!f) return;
  if (f.stage === "lastChance") {
    const w = res[0]?.w;
    if (f.lc && w) f.lc.winner = w;
    if (w) f.alive.push(w);
    f.stage = "bracket";
  } else {
    const r = f.rounds[f.rounds.length - 1];
    if (r) {
      r.winners = [...res.map((x) => x.w), ...r.byes];
      f.alive = r.winners;
    }
  }
  planRound(s, rng);
}

function planRound(s: GameState, rng: Rng): void {
  const f = s.finale as NonNullable<GameState["finale"]>;
  if (f.alive.length < 2) {
    s.king = f.alive[0] ?? s.players[0]?.id ?? "";
    s.queue = [];
    return;
  }
  let ids = shuffle(f.alive, rng);
  let byes: string[] = [];
  if (ids.length % 2) {
    const r = pickByes(ids, 1, s.sat, rng);
    s.sat = r.sat;
    byes = r.byes;
    ids = ids.filter((i) => !byes.includes(i));
  }
  s.queue = pairUp(ids, "finale");
  f.rounds.push({ pairs: s.queue.map((m) => [m.a, m.b]), byes, winners: [] });
}
