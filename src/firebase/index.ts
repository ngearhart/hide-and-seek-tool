import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyC19R-M2RZKhGK9Xcv3SkeF_0plmzcmz8o",
    authDomain: "hideseek.live",
    databaseURL: "https://hide-and-seek-64012-default-rtdb.firebaseio.com",
    projectId: "hide-and-seek-64012",
    storageBucket: "hide-and-seek-64012.firebasestorage.app",
    messagingSenderId: "94423405438",
    appId: "1:94423405438:web:c4ef0979d6c8e0f6ded92f",
    measurementId: "G-D5VKVCQK3K"
};

function initialize(existingApp: FirebaseApp | undefined) {
  const firebaseApp = existingApp || initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  const db = getDatabase(firebaseApp);
  const functions = getFunctions(firebaseApp);
  if (window.location.href.includes("127.0.0.1")) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectDatabaseEmulator(db, "127.0.0.1", 9000);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }
  return firebaseApp;
}

export default function getFirebase() {
  const existingApp = getApps()[0];
  return initialize(existingApp);
}
