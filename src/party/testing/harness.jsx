import { act, render } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PhoneApp from "../screens/phone/PhoneApp";
import TvApp from "../screens/tv/TvApp";
import { createSocketFactory } from "./fakeSocket";

/** In-memory Storage stand-in. */
export function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

/**
 * Render a phone or TV app against a fake socket.
 * @param {{kind?: "phone"|"tv", path?: string, storage?: object}} [o]
 */
export function renderParty({ kind = "phone", path = "/party", storage = memoryStorage() } = {}) {
  const socketFactory = createSocketFactory();
  const App = kind === "tv" ? TvApp : PhoneApp;
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/party/join/:code" element={<App socketFactory={socketFactory} storage={storage} />} />
        <Route path="*" element={<App socketFactory={socketFactory} storage={storage} />} />
      </Routes>
    </MemoryRouter>,
  );
  return {
    ...utils,
    storage,
    socketFactory,
    /** Open the latest socket (as the network would). */
    open: () => act(() => socketFactory.last().open()),
    /** Push a server frame to the latest socket. */
    push: (body) => act(() => socketFactory.last().receive(body)),
    sent: () => socketFactory.sockets.flatMap((s) => s.sent),
  };
}
