// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKMXRkxuF1_bJskyXimDzO3-TfDHneD8c",
  authDomain: "skp-clinic-qms-webapp.firebaseapp.com",
  databaseURL: "https://skp-clinic-qms-webapp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "skp-clinic-qms-webapp",
  storageBucket: "skp-clinic-qms-webapp.firebasestorage.app",
  messagingSenderId: "28360845193",
  appId: "1:28360845193:web:6a07ddb2c58964f37de358",
  measurementId: "G-VQLW7TJ5SB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);