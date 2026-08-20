import { useCallback } from "react";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { useAsyncOnce } from "../../hooks/useAsyncOnce";

const TWIST_DOC_ID = "twistcards";

function shuffle(cards) {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function fetchSingleDeck(id) {
  const snap = await getDoc(doc(db, "truthordrink", id));
  if (!snap.exists()) return { name: undefined, cards: [], rules: undefined };
  const data = snap.data();
  return { name: data.name, cards: data.Cards ?? [], rules: data.rules };
}

async function fetchShuffledDeck() {
  const snapshot = await getDocs(collection(db, "truthordrink"));
  let cards = [];
  snapshot.forEach((docSnap) => {
    if (docSnap.id !== TWIST_DOC_ID) {
      cards = [...cards, ...(docSnap.data().Cards ?? [])];
    }
  });
  return { name: undefined, cards: shuffle(cards), rules: undefined };
}

async function fetchTwistCards() {
  const snap = await getDoc(doc(db, "truthordrink", TWIST_DOC_ID));
  return snap.exists() ? snap.data().Cards ?? [] : [];
}

/**
 * Shared data-fetching for the Truth or Drink experience. `mode: "single"`
 * fetches one deck by id (Truthordrinkplayer); `mode: "random"` pools and
 * shuffles every deck (Truthordrinkrandom). Both fetch the shared twist deck.
 */
export function useTruthOrDrinkDeck(mode, id) {
  const fetchMain = useCallback(
    () => (mode === "random" ? fetchShuffledDeck() : fetchSingleDeck(id)),
    [mode, id]
  );
  const { data: deck, loading } = useAsyncOnce(fetchMain, [fetchMain]);
  const { data: twistCards } = useAsyncOnce(fetchTwistCards, []);

  return {
    loading,
    name: deck?.name,
    cards: deck?.cards ?? [],
    rules: deck?.rules,
    displayRules: mode === "random" ? true : Boolean(deck?.rules?.length),
    twistCards: twistCards ?? [],
  };
}
