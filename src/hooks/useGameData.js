import { useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAsyncOnce } from "./useAsyncOnce";

/**
 * Fetches a single Firestore document and tracks loading/error state.
 * Centralizes the getDoc-in-a-useEffect pattern duplicated across games.
 */
export function useGameData(collectionName, docId) {
  const fetchDoc = useCallback(async () => {
    if (!docId) return null;
    const snap = await getDoc(doc(db, collectionName, docId));
    return snap.exists() ? snap.data() : null;
  }, [collectionName, docId]);

  return useAsyncOnce(fetchDoc, [fetchDoc]);
}
