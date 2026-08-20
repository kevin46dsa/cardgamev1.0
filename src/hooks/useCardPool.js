import { useCallback, useEffect, useState } from "react";

/**
 * A shuffleable pool of cards you draw from without replacement.
 * Replaces the copy-pasted splice-a-random-index `getRandomCard` helper
 * duplicated across Game.jsx, Truthordrinkplayer.jsx and Truthordrinkrandom.jsx.
 */
export function useCardPool(initialCards) {
  const [pool, setPool] = useState(initialCards ?? []);

  useEffect(() => {
    setPool(initialCards ?? []);
  }, [initialCards]);

  const draw = useCallback(() => {
    if (pool.length === 0) return undefined;
    const index = Math.floor(Math.random() * pool.length);
    const drawn = pool[index];
    setPool(pool.filter((_, i) => i !== index));
    return drawn;
  }, [pool]);

  return { pool, draw, isEmpty: pool.length === 0 };
}
