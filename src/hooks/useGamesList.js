import { fetchGames } from "../Utils/Basic";
import { useAsyncOnce } from "./useAsyncOnce";

/**
 * Fetches every "game" document once on mount.
 */
export function useGamesList() {
  const { data, loading, error } = useAsyncOnce(fetchGames, []);
  return { games: data ?? [], loading, error };
}
