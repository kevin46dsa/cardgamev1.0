import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { IDLE_PHASES, WS_URL } from "../config";
import * as msg from "../transport/actions";
import { createClock } from "../transport/clock";
import { createConnection } from "../transport/connection";
import { createDeadlineTimer } from "../transport/deadline";
import { createSessionStore } from "../transport/session";
import { createInitialState } from "./initialState";
import { partyActions, reducer } from "./reducer";
import { isDriver } from "./selectors";

const PartyContext = createContext(null);

const defaultSocketFactory = (url) => new WebSocket(url);
const CLOCK_SYNC_EVENTS = ["snapshot", "pairCode", "pong"];

/**
 * Owns the socket, clock, deadline timer and reducer for one client.
 * @param {object} props
 * @param {"tv"|"phone"} props.kind which kind of client this is
 * @param {string} [props.url] WebSocket endpoint (defaults to VITE_WS_URL)
 * @param {(url:string)=>WebSocket} [props.socketFactory] injectable for tests
 * @param {Storage} [props.storage] injectable for tests
 */
export function PartyProvider({ kind, url = WS_URL, socketFactory = defaultSocketFactory, storage, children }) {
  const store = useMemo(() => createSessionStore(kind, storage), [kind, storage]);
  const [state, dispatch] = useReducer(reducer, null, () => createInitialState(store.load()));
  const clock = useMemo(() => createClock(), []);
  const connRef = useRef(null);
  const timerRef = useRef(null);
  const pendingRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const conn = createConnection({
      url,
      socketFactory,
      onStatus: (status) => dispatch(partyActions.conn(status)),
      onMessage: (m) => {
        if (CLOCK_SYNC_EVENTS.includes(m.event)) clock.sync(m.serverNow);
        dispatch(partyActions.server(m));
      },
      handshake: () => {
        const first = pendingRef.current;
        pendingRef.current = null;
        if (first) return first;
        const s = stateRef.current.session;
        if (!s?.roomCode) return null;
        if (kind === "tv") return s.tvToken ? msg.tvRejoin(s) : null;
        return s.token ? msg.rejoin(s) : null;
      },
    });
    connRef.current = conn;
    timerRef.current = createDeadlineTimer(clock, (phaseId) => conn.send(msg.advance(phaseId)));
    if (kind === "tv" || stateRef.current.session) conn.connect();
    return () => {
      timerRef.current.clear();
      conn.close();
      connRef.current = null;
    };
  }, [kind, url, socketFactory, clock]);

  const driver = isDriver(kind, state.view);
  useEffect(() => {
    timerRef.current?.arm({ deadline: state.nextDeadline, phaseId: state.view?.phaseId, driver });
  }, [state.nextDeadline, state.view?.phaseId, driver]);

  const idle = state.view
    ? IDLE_PHASES.includes(state.view.phase) || state.view.pausedUntil != null
    : kind === "tv" && !!state.pairCode;
  useEffect(() => {
    connRef.current?.setIdlePing(idle);
  }, [idle, state.conn]);

  useEffect(() => {
    store.save(state.session);
  }, [store, state.session]);

  // TV: ask for a pairing code whenever it has no room and no live code.
  const needsPair = kind === "tv" && state.conn === "open" && !state.session && !state.pairCode && !state.ended;
  useEffect(() => {
    if (needsPair) connRef.current?.send(msg.tvPair());
  }, [needsPair]);

  const pairExpiry = state.pairCode?.expiresAt;
  useEffect(() => {
    if (pairExpiry == null) return undefined;
    const handle = setTimeout(() => dispatch(partyActions.pairExpired()), clock.remaining(pairExpiry));
    return () => clearTimeout(handle);
  }, [pairExpiry, clock]);

  const actions = useMemo(() => {
    const send = (m) => connRef.current?.send(m);
    /** Send now if connected, otherwise open the socket and send as the handshake. */
    const start = (m) => {
      if (connRef.current?.isOpen()) return connRef.current.send(m);
      pendingRef.current = m;
      connRef.current?.connect();
      return true;
    };
    return {
      createRoom: (p) => start(msg.createRoom(p)),
      joinRoom: (roomCode, name) => start(msg.joinRoom(roomCode, name)),
      leaveRoom: () => send(msg.leaveRoom()),
      updateSettings: (patch) => send(msg.updateSettings(patch)),
      startGame: () => send(msg.startGame()),
      kickPlayer: (id) => send(msg.kickPlayer(id)),
      makeHost: (id) => send(msg.makeHost(id)),
      endGame: () => send(msg.endGame()),
      playAgain: () => send(msg.playAgain()),
      submitAnswer: (text) => send(msg.submitAnswer(text)),
      castVote: (side) => send(msg.castVote(side)),
      chooseTieBreak: (choice) => send(msg.chooseTieBreak(choice)),
      retry: () => connRef.current?.retry(),
      dismissError: () => dispatch(partyActions.dismissError()),
      dismissWelcome: () => dispatch(partyActions.dismissWelcome()),
      reset: () => dispatch(partyActions.reset()),
    };
  }, []);

  const value = useMemo(() => ({ state, kind, clock, actions }), [state, kind, clock, actions]);
  return <PartyContext.Provider value={value}>{children}</PartyContext.Provider>;
}

/** @returns {{state: object, kind: "tv"|"phone", clock: object, actions: object}} */
export function useParty() {
  const ctx = useContext(PartyContext);
  if (!ctx) throw new Error("useParty must be used inside <PartyProvider>");
  return ctx;
}
