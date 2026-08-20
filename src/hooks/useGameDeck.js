import { useCallback, useState } from "react";
import { fetchGame } from "../Utils/Basic";
import { useAsyncOnce } from "./useAsyncOnce";

/**
 * Shared logic for "draw a random prompt from a Firestore field" games
 * (Truth or Dare, Never Have I Ever, Who's Most Likely To...).
 *
 * @param {string} gameId - document id in the "game" collection
 */
export function useGameDeck(gameId) {
  const { data, loading, error } = useAsyncOnce(() => fetchGame(gameId), [gameId]);
  const [message, setMessage] = useState("");
  // Increments on every draw so a card-flip animation can key off it — unlike
  // `message`, which can repeat the same string on consecutive draws from a
  // small pool and would silently fail to re-trigger a remount-based animation.
  const [drawId, setDrawId] = useState(0);

  const pick = useCallback(
    (field) => {
      const pool = data?.[field];
      if (!pool || pool.length === 0) return;
      const random = pool[Math.floor(Math.random() * pool.length)];
      setMessage(random);
      setDrawId((n) => n + 1);
    },
    [data]
  );

  return { data, loading, error, message, drawId, pick };
}
