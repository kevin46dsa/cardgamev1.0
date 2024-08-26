import { doc, getDoc,addDoc,collection } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
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
   *  A utility function to handle form changes
   * 
   */
 export function onChangeFormDataHandler(e,setFormData) {
    let boolean = null;
    if (e.target.value === "true") {
      boolean = true;
    }
    if (e.target.value === "false") {
      boolean = false;
    }
    // Files
    if (e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: e.target.files,
      }));
    }
    // Text/Boolean/Number
    if (!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }));
    }
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


/**
 * A utility function to Create a new game
 * 
 * @param {string} Name - The name of the game to create
 * @param {string} Thumbnail - The thumbnail of the game to create
 */

export async function createGame(Name, Thumbnail) {
    // Create a new game
    // Add a new document with a generated id.
    await addDoc(collection(db, "game"), {
        name: Name,
        imgUrls: [Thumbnail],
        Cards: [],
        rules: []
    });
  }


/**
 * A utility function to store image
 * 
 * @param {string} GameName - The name of the game to store the image
 * @param image - The image to store
 * @returns {string} The stored image
 */

export async function storeImage(GameName,image) {
  return new Promise((resolve, reject) => {
    // Gets a FirebaseStorage instance for the given Firebase app.
    const storage = getStorage();

    const filename = `${GameName}-${image.name}`;
    // Create a reference with an initial file path and name
    const storageRef = ref(storage, filename);
    // Uploads a full list of bytes to the Cloud Storage bucket
    const uploadTask = uploadBytesResumable(storageRef, image);
    // Listen for state changes, errors, and completion of the upload.
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
          default:
              console.log(`Sorry, Something went wrong`);
        }
      },
      (error) => {
        // Handle unsuccessful uploads
        reject(error);
      },
      () => {
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
}
  