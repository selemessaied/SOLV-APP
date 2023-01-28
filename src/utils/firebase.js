import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseProdConfig = {
  apiKey: "AIzaSyCVzNyZ5IC2gw_GrX-JeiQHHQVgy_DdM8o",
  authDomain: "solv-2e7c0.firebaseapp.com",
  projectId: "solv-2e7c0",
  storageBucket: "solv-2e7c0.appspot.com",
  messagingSenderId: "916060868193",
  appId: "1:916060868193:web:6db7bb87aa1f7b4468a420",
  measurementId: "G-MJX4EKQJ0B",
};

const app = initializeApp(firebaseProdConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
