// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAKMXRkxuF1_bJskyXimDzO3-TfDHneD8c",
  authDomain: "skp-clinic-qms-webapp.firebaseapp.com",
  databaseURL: "https://skp-clinic-qms-webapp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "skp-clinic-qms-webapp",
  storageBucket: "skp-clinic-qms-webapp.firebasestorage.app",
  messagingSenderId: "28360845193",
  appId: "1:28360845193:web:6a07ddb2c58964f37de358",
  measurementId: "G-VQLW7TJ5SB",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
