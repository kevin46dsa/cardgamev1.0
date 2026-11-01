import { STORAGE_KEYS } from "../config";

/**
 * localStorage-backed session store. Every access is wrapped: storage can throw (private mode, blocked data).
 * The stored token is a secret, so it never leaves this module except through load().
 * @param {"phone"|"tv"} kind
 * @param {Storage} [storage]
 */
export function createSessionStore(kind, storage) {
  const key = STORAGE_KEYS[kind];
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  return {
    /** @returns {object|null} stored session or null */
    load() {
      try {
        const parsed = JSON.parse(store.getItem(key));
        return parsed && typeof parsed === "object" && parsed.roomCode ? parsed : null;
      } catch {
        return null;
      }
    },
    /** Persist a session, or clear it when null. */
    save(session) {
      try {
        if (session?.roomCode) store.setItem(key, JSON.stringify(session));
        else store.removeItem(key);
      } catch {
        /* storage unavailable: the game still works, just without resume */
      }
    },
  };
}
