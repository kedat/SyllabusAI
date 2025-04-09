import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFD3rPqJNXyMN629_MbQ_-CNnw4ir9gV4",
  authDomain: "firestore-5e9a5.firebaseapp.com",
  projectId: "firestore-5e9a5",
  storageBucket: "firestore-5e9a5.appspot.com",
  messagingSenderId: "981583289996",
  appId: "1:981583289996:web:0877b2ac438ac33c0ea5a9",
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);