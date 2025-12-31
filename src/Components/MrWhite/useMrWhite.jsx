import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

import {
  // fetchGameData,
  createGameSchema,
  resetGameData,
  updatePlayerGameData,
} from "./DataSchema";

const GameID = "game1";

export function useMrWhite() {
  const [startGame, setStartGame] = useState(false);
  const [gameData, setGameData] = useState(null);
  const docRef = doc(db, "MrWhite", GameID);
  /*
  const unsub = onSnapshot(docRef, (doc) => {
    // console.log("Setting new data");
    // setGameData(doc.data());
  });
  */

  useEffect(() => {
    const fetchData = async () => {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const gameData = docSnap.data();
        console.log("Setting new data");
        setGameData(gameData);
      } else {
        console.log("No such document!");
      }
    };
    fetchData();
  }, [docRef]);

  // First we need to get the number of players from the user

  // Then we need to get the name and display the word/MR white to each player

  // Then we provide a screen for voting and display the results depending on the numebr of rounds

  const fetchWords = async () => {
    // make this smarter
    return ["Cat", "Tiger"];
  };

  // This method starts the game
  const startFunc = () => {
    console.log("Starting game");
    setStartGame(true);
  };

  const assignPlayerNameAndWords = async (playerIndex) => {};

  const createGame = async () => {
    console.log("Creating game");
    await createGameSchema();
  };

  const addPlayer = (name, word) => {
    updatePlayerGameData({ name, word });
  };

  /**
   * This method resets the game data
   */
  const resetGame = async () => {
    resetGameData();
    await createGameSchema();
  };

  return {
    startFunc,
    startGame,
    gameData,
    createGame,
    addPlayer,
    fetchWords,
    resetGame,
    assignPlayerNameAndWords,
  };
}
