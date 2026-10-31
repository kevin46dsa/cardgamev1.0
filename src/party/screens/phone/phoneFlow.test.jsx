import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../../config";
import { makeMatch, makeView, PLAYERS } from "../../testing/fixtures";
import { memoryStorage, renderParty } from "../../testing/harness";

const you = (role, extra = {}) => ({ id: "p1", role, status: "playing", forfeited: false, hill: null, isHost: true, ...extra });
const snap = (view) => ({ event: "snapshot", view, nextDeadline: null });

describe("phone: whole game against a fake socket (phone-only mode)", () => {
  it("creates a room, plays a match as contestant, votes as crowd, and reaches the King", async () => {
    const t = renderParty();

    // Entry: create a room
    fireEvent.click(screen.getByRole("button", { name: "Create a room" }));
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Maya" } });
    fireEvent.click(screen.getByRole("button", { name: "Create room" }));
    t.open();
    expect(t.sent()[0]).toEqual({ action: "createRoom", name: "Maya", mode: "phone" });

    // Lobby (host) with 3 players
    t.push({ event: "roomCreated", roomCode: "KQXM", playerId: "p1", token: "tok" });
    t.push(snap(makeView({ you: you("crowd") })));
    expect(JSON.parse(t.storage.getItem(STORAGE_KEYS.phone))).toEqual({ roomCode: "KQXM", playerId: "p1", token: "tok" });
    fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    expect(t.sent().at(-1)).toEqual({ action: "startGame" });

    // Intro -> write as a contestant
    const m1 = makeMatch({ contestants: ["p1", "p2"], stakes: { p1: true, p2: true } });
    t.push({ event: "state", view: makeView({ phase: "intro", phaseId: 1, you: you("contestant"), match: m1 }), nextDeadline: null });
    expect(screen.getByText(/up against Dev/)).toBeInTheDocument();
    t.push({ event: "state", view: makeView({ phase: "write", phaseId: 2, you: you("contestant"), match: m1 }), nextDeadline: null });
    fireEvent.change(screen.getByLabelText("Type something funny"), { target: { value: "Cluck Inn" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(t.sent().at(-1)).toEqual({ action: "submitAnswer", text: "Cluck Inn" });
    expect(screen.getByRole("button", { name: "Answer locked in" })).toBeDisabled();

    // Vote (contestant watches), tie, choose revote
    const sides = { A: "Cluck Inn", B: "Hen Seasons" };
    t.push({ event: "state", view: makeView({ phase: "vote", phaseId: 3, you: you("contestant"), match: { ...m1, sides } }), nextDeadline: null });
    expect(screen.getByText("Hen Seasons")).toBeInTheDocument();
    t.push({ event: "state", view: makeView({ phase: "tiebreak", phaseId: 4, you: you("contestant"), match: { ...m1, sides, votes: { A: 1, B: 1 }, chosen: [] } }), nextDeadline: null });
    fireEvent.click(screen.getByRole("button", { name: "Revote" }));
    expect(t.sent().at(-1)).toEqual({ action: "chooseTieBreak", choice: "revote" });
    t.push({ event: "ack", action: "chooseTieBreak" });
    expect(screen.getByText(/Choice locked in/)).toBeInTheDocument();

    // Reveal: win
    const result = { outcome: "win", reason: "votes", winner: "p1", loser: "p2" };
    t.push({ event: "reveal", view: makeView({ phase: "reveal", phaseId: 5, you: you("contestant"), match: { ...m1, sides, votes: { A: 2, B: 0 }, authors: { A: "p1", B: "p2" }, result } }), nextDeadline: null });
    expect(screen.getByRole("heading", { name: "Maya wins" })).toBeInTheDocument();

    // Transition with hills
    const hills = { champion: ["p1"], comeback: ["p2", "p3"], valley: { champion: [], comeback: [] }, sitsOut: [] };
    t.push({ event: "state", view: makeView({ phase: "transition", phaseId: 6, act: 2, hills, you: you("crowd", { hill: "champion" }) }), moves: [{ id: "p1", from: null, to: "champion" }], nextDeadline: null });
    expect(screen.getByText("Champion Hill")).toBeInTheDocument();

    // Next match as crowd: vote B
    const m2 = makeMatch({ n: 2, contestants: ["p2", "p3"] });
    t.push({ event: "state", view: makeView({ phase: "vote", phaseId: 7, you: you("crowd"), match: { ...m2, sides } }), nextDeadline: null });
    fireEvent.click(screen.getByRole("button", { name: /Hen Seasons/ }));
    expect(t.sent().at(-1)).toEqual({ action: "castVote", side: "B" });
    t.push({ event: "voteAck", side: "B" });
    expect(screen.getByRole("button", { name: /Hen Seasons/ })).toHaveAttribute("aria-pressed", "true");

    // Final
    t.push({ event: "state", view: makeView({ phase: "final", phaseId: 8, king: "p1", you: you("crowd") }), nextDeadline: null });
    expect(screen.getByText("King of the Hill")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Play again" }));
    expect(t.sent().at(-1)).toEqual({ action: "playAgain" });
  });

  it("shows friendly errors and the kicked screen", async () => {
    const t = renderParty({ path: "/party/join/KQXM" });
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Dev" } });
    fireEvent.click(screen.getByRole("button", { name: "Join" }));
    t.open();
    expect(t.sent()[0]).toEqual({ action: "joinRoom", roomCode: "KQXM", name: "Dev" });
    t.push({ event: "error", code: "NAME_TAKEN", message: "raw" });
    expect(screen.getByRole("alert")).toHaveTextContent("Someone already has that name");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).toBeNull();
    t.push({ event: "joined", playerId: "p2", token: "t2" });
    t.push(snap(makeView({ you: you("crowd", { id: "p2", isHost: false }) })));
    t.push({ event: "kicked" });
    expect(screen.getByRole("heading", { name: "You were removed" })).toBeInTheDocument();
  });

  it("rejoins once from stored session after a drop and shows welcome back", async () => {
    const storage = memoryStorage({ [STORAGE_KEYS.phone]: JSON.stringify({ roomCode: "KQXM", playerId: "p2", token: "t2" }) });
    const t = renderParty({ storage });
    await waitFor(() => expect(t.socketFactory.sockets).toHaveLength(1));
    t.open();
    expect(t.sent()).toEqual([{ action: "rejoin", roomCode: "KQXM", playerId: "p2", token: "t2" }]);
    const returning = you("crowd", { id: "p2", isHost: false, status: "returning", hill: "comeback" });
    t.push(snap(makeView({ phase: "write", phaseId: 2, match: makeMatch(), you: returning })));
    expect(screen.getByRole("heading", { name: "Welcome back!" })).toBeInTheDocument();
    expect(screen.getByText(/Comeback Hill/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("A fancy hotel for chickens")).toBeInTheDocument();
    act(() => t.socketFactory.last().drop());
  });

  it("sends a TV pair code as mode tv", () => {
    const t = renderParty();
    fireEvent.click(screen.getByRole("button", { name: "Create a room" }));
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Maya" } });
    fireEvent.change(screen.getByLabelText("TV code (optional)"), { target: { value: "9236" } });
    fireEvent.click(screen.getByRole("button", { name: "Create room" }));
    t.open();
    expect(t.sent()[0]).toEqual({ action: "createRoom", name: "Maya", mode: "tv", pairCode: "9236" });
    expect(PLAYERS).toHaveLength(3);
  });
});
