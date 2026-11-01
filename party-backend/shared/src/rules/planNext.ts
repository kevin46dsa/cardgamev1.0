import { nextFinale, startFinale } from "./finale";
import { planAct1 } from "./planAct1";
import { planAct2 } from "./planAct2";
import { planAct3 } from "./planAct3";
import type { BatchResult, GameState, Rng } from "./types";
import { find } from "./util";

function setHill(s: GameState, id: string, h: "champion" | "comeback") {
  const p = find(s, id);
  if (p) p.hill = h;
}

// Called when a batch (act or finale round) has no matches left. Applies its hill moves and plans the next batch,
// skipping empty ones; ends with a non-empty s.queue or s.king set. `s.act` is the batch that just finished
// (0 = game just started).
export function planNext(s: GameState, rng: Rng): void {
  for (let guard = 0; guard < 30 && !s.queue.length && !s.king; guard++) {
    const res: BatchResult[] = s.results;
    s.results = [];
    for (const p of s.players) delete p.forfeited;
    if (s.act === 0) {
      s.act = 1;
      planAct1(s, rng);
    } else if (s.act === 1) {
      for (const r of res) { setHill(s, r.w, "champion"); setHill(s, r.l, "comeback"); }
      for (const id of s.byes) setHill(s, id, s.settings.oddPlayerStart);
      s.act = 2;
      s.round = 1;
      planAct2(s, rng);
    } else if (s.act === 2) {
      // Champion-hill losers and comeback-hill winners go to the Valley. Their stored hill stays until Act 3 ends.
      s.valley = { champion: [], comeback: [] };
      for (const r of res) {
        if (find(s, r.l)?.hill === "champion") s.valley.champion.push(r.l);
        if (find(s, r.w)?.hill === "comeback") s.valley.comeback.push(r.w);
      }
      s.act = 3;
      planAct3(s, rng);
    } else if (s.act === 3) {
      // Valley winner -> champion, loser -> comeback. The fate decider never moves.
      for (const r of res) {
        if (r.fate !== r.w) setHill(s, r.w, "champion");
        if (r.fate !== r.l) setHill(s, r.l, "comeback");
      }
      s.valley = { champion: [], comeback: [] };
      if (s.round < s.settings.rounds) {
        s.round++;
        s.act = 2;
        planAct2(s, rng);
      } else {
        s.act = 4;
        startFinale(s, rng);
      }
    } else nextFinale(s, res, rng);
  }
}
