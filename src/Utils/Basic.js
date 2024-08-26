import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
/**
 * A utility function that calculates dimensions based on a fixed ratio.
 *
 * @param {number} desiredHeight - The height you want for the element.
 * @param {number} ratioWidth - The width part of the ratio (default: 1011).
 * @param {number} ratioHeight - The height part of the ratio (default: 638).
 * @returns {object} An object containing the calculated width and the desired height.
 */
export function calculateDimensions(desiredHeight, ratioWidth = 1011, ratioHeight = 638) {
    const calculatedWidth = (desiredHeight * ratioWidth) / ratioHeight;
    
    return {
      width: calculatedWidth,
      height: desiredHeight
    };
  }

  /**
   * A utility function to fetch data for a game
   * 
   * @param {string} Name - The name of the game to fetch
   */
    export async function fetchGame(Name) {

        const docRef =  doc(db, "game", Name);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            let Data = docSnap.data()
            return Data;
          } else {
            // docSnap.data() will be undefined in this case
            return [];
          }
    }