import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../../config";
import { makeMatch, makeView, PLAYERS } from "../../testing/fixtures";
import { memoryStorage, renderParty } from "../../testing/harness";

const tvView = (o) => makeView({ mode: "tv", you: undefined, ...o });
const snap = (view, nextDeadline = null) => ({ event: "snapshot", view, nextDeadline });

describe("TV screens", () => {
  it("pairs, shows the lobby, enables Start at 3 players and shows live vote counts", () => {
    const t = renderParty({ kind: "tv", path: "/party/tv" });
    expect(screen.getByText("Connecting...")).toBeInTheDocument();
    t.open();
    expect(t.sent()).toEqual([{ action: "tvPair" }]);
    t.push({ event: "pairCode", code: "9236", expiresAt: Date.now() + 600_000 });
    expect(screen.getByText("9236")).toBeInTheDocument();

    t.push({ event: "paired", roomCode: "KQXM", tvToken: "tv1" });
    t.push(snap(tvView({ players: PLAYERS.slice(0, 2) })));
    expect(screen.getByText("KQXM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start game/ })).toBeDisabled();
    t.push({ event: "players", players: PLAYERS, hostId: "p1", nextDeadline: null });
    fireEvent.click(screen.getByRole("button", { name: /Start game/ }));
    expect(t.sent().at(-1)).toEqual({ action: "startGame" });

    const sides = { A: "Cluck Inn", B: "Hen Seasons" };
    t.push({ event: "state", view: tvView({ phase: "vote", phaseId: 3, match: { ...makeMatch(), sides } }), nextDeadline: null });
    t.push({ event: "voteCount", have: 1, need: 3 });
    expect(screen.getByText("1 of 3 votes in")).toBeInTheDocument();
    expect(screen.getByText("Cluck Inn")).toBeInTheDocument();
  });

  it("sends advance for the current phase when the deadline passes", async () => {
    const t = renderParty({ kind: "tv", path: "/party/tv" });
    t.open();
    t.push({ event: "paired", roomCode: "KQXM", tvToken: "tv1" });
    const soon = Date.now() + 100;
    t.push({ event: "state", view: tvView({ phase: "intro", phaseId: 7, endsAt: soon, match: makeMatch() }), nextDeadline: soon });
    await waitFor(() => expect(t.sent().at(-1)).toEqual({ action: "advance", phaseId: 7 }), { timeout: 2000 });
  });

  it("shows paused and ended screens, then asks for a new code", () => {
    const t = renderParty({ kind: "tv", path: "/party/tv" });
    t.open();
    t.push({ event: "paired", roomCode: "KQXM", tvToken: "tv1" });
    t.push(snap(tvView({ phase: "write", phaseId: 2, pausedUntil: Date.now() + 60_000, match: makeMatch() })));
    expect(screen.getByRole("heading", { name: "Game paused" })).toBeInTheDocument();
    t.push({ event: "roomEnded", reason: "host" });
    fireEvent.click(screen.getByRole("button", { name: "Start a new room" }));
    expect(t.sent().at(-1)).toEqual({ action: "tvPair" });
  });

  it("renders the Finale bracket and King on the final screen", () => {
    const t = renderParty({ kind: "tv", path: "/party/tv" });
    t.open();
    t.push({ event: "paired", roomCode: "KQXM", tvToken: "tv1" });
    const finale = { stage: "bracket", alive: ["p1", "p2"], rounds: [{ pairs: [["p1", "p2"]], byes: [], winners: ["p1"] }] };
    t.push(snap(tvView({ phase: "final", phaseId: 9, king: "p1", finale })));
    expect(screen.getByText("King of the Hill")).toBeInTheDocument();
    expect(screen.getByText(/Maya vs Dev \(Maya advances\)/)).toBeInTheDocument();
  });
});

describe("phone with a TV", () => {
  it("shows a personal result instead of the full reveal board", () => {
    const storage = memoryStorage({ [STORAGE_KEYS.phone]: JSON.stringify({ roomCode: "KQXM", playerId: "p2", token: "t" }) });
    const t2 = renderParty({ storage });
    t2.open();
    const m = makeMatch();
    const result = { outcome: "win", reason: "votes", winner: "p3", loser: "p2" };
    t2.push(snap(makeView({ mode: "tv", phase: "reveal", phaseId: 5, you: { id: "p2", role: "contestant", status: "playing", forfeited: false, hill: null, isHost: false }, match: { ...m, sides: { A: "a", B: "b" }, authors: { A: "p2", B: "p3" }, result } })));
    expect(screen.getByRole("heading", { name: "You lost this one." })).toBeInTheDocument();
  });
});
