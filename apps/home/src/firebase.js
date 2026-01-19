// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 從 Firebase 控制台複製這些設定
const firebaseConfig = {
  apiKey: "AIzaSyChKqWce9tBRIRlWM-XqtVb4rjCLsGbg6Q",
  authDomain: "mrkfengshui.firebaseapp.com",
  projectId: "mrkfengshui",
  storageBucket: "mrkfengshui.firebasestorage.app",
  messagingSenderId: "473774459686",
  appId: "1:473774459686:web:45fa3fdf4b30c0d457cfe7",
  measurementId: "G-HFDJ17LL2D"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);