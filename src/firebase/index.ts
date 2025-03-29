import { initializeApp } from 'firebase/app'

const firebaseConfig = {
    apiKey: "AIzaSyC19R-M2RZKhGK9Xcv3SkeF_0plmzcmz8o",
    authDomain: window.location.origin == "http://localhost:3000" ? "localhost:3000" : "hideseek.live",
    databaseURL: "https://hide-and-seek-64012-default-rtdb.firebaseio.com",
    projectId: "hide-and-seek-64012",
    storageBucket: "hide-and-seek-64012.firebasestorage.app",
    messagingSenderId: "94423405438",
    appId: "1:94423405438:web:c4ef0979d6c8e0f6ded92f",
    measurementId: "G-D5VKVCQK3K"
  };
  
// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;

