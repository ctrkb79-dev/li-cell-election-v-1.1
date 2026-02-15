
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBlhr0PzoapyDFuaA09Ia5nkwWfeTEkGi0",
  authDomain: "election-bfd18.firebaseapp.com",
  projectId: "election-bfd18",
  storageBucket: "election-bfd18.firebasestorage.app",
  messagingSenderId: "452998212974",
  appId: "1:452998212974:web:5e8636e944b9cbcbd6e57f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
