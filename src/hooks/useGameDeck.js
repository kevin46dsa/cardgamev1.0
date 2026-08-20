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

  const pick = useCallback(
    (field) => {
      const pool = data?.[field];
      if (!pool || pool.length === 0) return;
      const random = pool[Math.floor(Math.random() * pool.length)];
      setMessage(random);
    },
    [data]
  );

  return { data, loading, error, message, pick };
}
