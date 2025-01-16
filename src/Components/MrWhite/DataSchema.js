import { db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";

const gameRef = doc(db, "MrWhite", "game1");

const newGameTemplate = {
  players: [],
  activeRound: 0,
  activePlayerIndex: 0,
  votes: [],
};

const newPlayerTemplate = {
  name: "",
  word: "",
};

const votingTable = {
  round: 0,
  votes: [],
};

/*
const votingTemplate = {
  vote: true,
  playerIndex: 0,
};
*/

/**
 * This method creates the schema for the Player object
 * and stores the data in local storage
 */
export const createGameSchema = async (noOfPlayers) => {
  //TODO need to find a way to make more sessions unique

  // Create the player object
  let newGameTemplateObj = newGameTemplate;

  await updateDoc(gameRef, newGameTemplateObj);

  let players = [];
  for (let i = 0; i < noOfPlayers; i++) {
    players.push(newPlayerTemplate);
  }

  // Update the player object in the game object
  newGameTemplateObj.players = players;
  // Initialize the voting table for each player
  let votingTables = [];
  for (let i = 0; i < noOfPlayers; i++) {
    votingTables.push({ ...votingTable, round: i });
  }

  // Add the voting tables to the game object
  newGameTemplateObj.votingTables = votingTables;

  console.log(newGameTemplateObj);

  window.localStorage.setItem(
    "MR_WHITE_GAME_DATA",
    JSON.stringify(newGameTemplateObj)
  );
  await updateDoc(gameRef, newGameTemplateObj);
};

/**
 * This method fetches the GameData from local storage
 */
export const fetchGameData = () => {
  return JSON.parse(window.localStorage.getItem("MR_WHITE_GAME_DATA"));
};

/**
 * This method adds a new Player to the Player object
 * expected player data object
 * {
 *   name: "Player1",
 *   word: "Word1"
 * }
 */
export const updatePlayerGameData = (data) => {
  const oldData = fetchGameData();
  oldData.players.push(data);

  window.localStorage.setItem("MR_WHITE_GAME_DATA", JSON.stringify(oldData));
};

/**
 * This method updates the active round of the game
 * @param {Number} round
 */
export const updateActiveRound = (round) => {
  const oldData = fetchGameData();
  oldData.activeRound = round;

  window.localStorage.setItem("MR_WHITE_GAME_DATA", JSON.stringify(oldData));
};

/**
 * This method updates the active player index
 */
export const updateActivePlayerIndex = (index) => {
  const oldData = fetchGameData();
  oldData.activePlayerIndex = index;

  window.localStorage.setItem("MR_WHITE_GAME_DATA", JSON.stringify(oldData));
};

/**
 * This method resets the game data
 */
export const resetGameData = () => {
  window.localStorage.removeItem("MR_WHITE_GAME_DATA");
};
