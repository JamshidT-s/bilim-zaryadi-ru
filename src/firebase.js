import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBXiCn2dcHS0lJ41b1hA3wOzd4qMyVu5EE",
  authDomain: "power-9195c.firebaseapp.com",
  projectId: "power-9195c",
  storageBucket: "power-9195c.firebasestorage.app",
  messagingSenderId: "150171585290",
  appId: "1:150171585290:web:6baca0fa76b96d4c6188f3",
  measurementId: "G-S6FB62WFF1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);