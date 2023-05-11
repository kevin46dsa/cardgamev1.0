// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCj69emN7_WHDgj8d0Jc0Vf2gGF-5mTH2A",
  authDomain: "card-game-45e80.firebaseapp.com",
  projectId: "card-game-45e80",
  storageBucket: "card-game-45e80.appspot.com",
  messagingSenderId: "213213288776",
  appId: "1:213213288776:web:d04b2787a7be815f917b7d"
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore()