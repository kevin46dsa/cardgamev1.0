import { describe, expect, it } from "vitest";
import { makeMatch, makeView, PLAYERS } from "../testing/fixtures";
import { createInitialState } from "./initialState";
import { partyActions, reducer } from "./reducer";

const apply = (state, ...msgs) => msgs.reduce((s, m) => reducer(s, partyActions.server(m)), state);
const fresh = () => createInitialState(null);

describe("party reducer", () => {
  it("stores session from roomCreated and completes joined sessions from the snapshot", () => {
    let s = apply(fresh(), { event: "joined", playerId: "p2", token: "tok" });
    expect(s.session.roomCode).toBeNull();
    s = apply(s, { event: "snapshot", view: makeView(), nextDeadline: null });
    expect(s.session).toEqual({ roomCode: "KQXM", playerId: "p2", token: "tok" });
    s = apply(fresh(), { event: "roomCreated", roomCode: "ABCD", playerId: "p1", token: "t" });
    expect(s.session.roomCode).toBe("ABCD");
  });

  it("clears per-phase ephemera on a new phaseId but not on repeats", () => {
    let s = apply(fresh(), { event: "snapshot", view: makeView({ phase: "write", phaseId: 2, match: makeMatch() }), nextDeadline: 10 });
    s = apply(s, { event: "submitted", contestantId: "p2" }, { event: "submitted", contestantId: "p2" }, { event: "voteCount", have: 1, need: 2 });
    expect(s.submitted).toEqual(["p2"]);
    s = apply(s, { event: "players", players: PLAYERS, hostId: "p1", nextDeadline: 10 });
    expect(s.submitted).toEqual(["p2"]);
    s = apply(s, { event: "state", view: makeView({ phase: "vote", phaseId: 3 }), nextDeadline: 20 });
    expect(s.submitted).toEqual([]);
    expect(s.voteCount).toBeNull();
    expect(s.nextDeadline).toBe(20);
  });

  it("records votes, tie acks and restores a vote from the snapshot", () => {
    let s = apply(fresh(), { event: "voteAck", side: "B" }, { event: "ack", action: "chooseTieBreak" });
    expect(s.myVote).toBe("B");
    expect(s.tieAcked).toBe(true);
    s = apply(fresh(), { event: "snapshot", view: makeView({ phase: "vote", phaseId: 3, match: makeMatch({ yourVote: "A" }) }), nextDeadline: 1 });
    expect(s.myVote).toBe("A");
  });

  it("keeps the room view in sync for players, settings, host, pause and resume", () => {
    let s = apply(fresh(), { event: "snapshot", view: makeView(), nextDeadline: null });
    s = apply(s, { event: "hostChanged", hostId: "p2", nextDeadline: null });
    expect(s.view.you.isHost).toBe(false);
    s = apply(s, { event: "settings", settings: { ...s.view.settings, rounds: 2 }, estimatedMinutes: 20 });
    expect(s.view.settings.rounds).toBe(2);
    s = apply(s, { event: "paused", until: 99, nextDeadline: 99 });
    expect(s.view.pausedUntil).toBe(99);
    s = apply(s, { event: "resumed", endsAt: 150, nextDeadline: 150 });
    expect(s.view.pausedUntil).toBeUndefined();
    expect(s.view.endsAt).toBe(150);
  });

  it("flags welcome back only for a returning snapshot", () => {
    const returning = makeView({ you: { ...makeView().you, status: "returning" } });
    expect(apply(fresh(), { event: "snapshot", view: returning, nextDeadline: null }).welcomeBack).toBe(true);
    expect(apply(fresh(), { event: "snapshot", view: makeView(), nextDeadline: null }).welcomeBack).toBe(false);
  });

  it("handles terminal events: kicked, left, roomEnded", () => {
    const inRoom = apply(fresh(), { event: "roomCreated", roomCode: "ABCD", playerId: "p1", token: "t" }, { event: "snapshot", view: makeView(), nextDeadline: null });
    expect(apply(inRoom, { event: "kicked" })).toMatchObject({ kicked: true, session: null, view: null });
    expect(apply(inRoom, { event: "left" })).toMatchObject({ left: true, session: null });
    expect(apply(inRoom, { event: "roomEnded", reason: "idle" })).toMatchObject({ ended: "idle", session: null });
  });

  it("maps errors to friendly text, ignores stale/early, and drops a dead session on rejoin", () => {
    let s = apply(fresh(), { event: "error", code: "NAME_TAKEN", message: "x" });
    expect(s.error).toEqual({ code: "NAME_TAKEN", message: expect.stringContaining("name") });
    expect(apply(fresh(), { event: "error", code: "STALE_PHASE" }).error).toBeNull();
    const rejoining = createInitialState({ roomCode: "ABCD", playerId: "p1", token: "t" });
    expect(apply(rejoining, { event: "error", code: "TOKEN_INVALID" })).toMatchObject({ session: null, error: { code: "TOKEN_INVALID" } });
    expect(apply(rejoining, { event: "error", code: "KICKED" }).kicked).toBe(true);
    expect(apply(rejoining, { event: "error", code: "ROOM_ENDED" }).ended).toBe("host");
    s = apply(fresh(), { event: "error", code: "ROOM_ENDED" });
    expect(s.ended).toBeNull();
  });

  it("tracks TV pairing, tvStatus and reset", () => {
    let s = apply(fresh(), { event: "pairCode", code: "9236", expiresAt: 5 });
    expect(s.pairCode.code).toBe("9236");
    s = apply(s, { event: "paired", roomCode: "KQXM", tvToken: "tv" }, { event: "tvStatus", connected: false });
    expect(s).toMatchObject({ pairCode: null, session: { roomCode: "KQXM", tvToken: "tv" }, tvConnected: false });
    expect(reducer({ ...s, conn: "open" }, partyActions.reset())).toMatchObject({ session: null, conn: "open" });
  });
});
