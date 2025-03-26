// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC19R-M2RZKhGK9Xcv3SkeF_0plmzcmz8o",
  authDomain: "hide-and-seek-64012.firebaseapp.com",
  databaseURL: "https://hide-and-seek-64012-default-rtdb.firebaseio.com",
  projectId: "hide-and-seek-64012",
  storageBucket: "hide-and-seek-64012.firebasestorage.app",
  messagingSenderId: "94423405438",
  appId: "1:94423405438:web:c4ef0979d6c8e0f6ded92f",
  measurementId: "G-D5VKVCQK3K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
