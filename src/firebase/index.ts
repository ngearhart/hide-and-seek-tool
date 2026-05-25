import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import type { LatLngExpression } from 'leaflet';
import type { FeatureType } from '@/regions/features';

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

type TileRequest = {
  x: number,
  y: number,
  z: number
}

export function getTile(firebaseApp: FirebaseApp, request: TileRequest): Promise<HttpsCallableResult<unknown>> {
  return httpsCallable(getFunctions(firebaseApp), 'getTile')(request)
} 


type SearchForFeaturesRequest = {
    regionName: string,
    featureType: FeatureType,
    corner1: LatLngExpression,
    corner2: LatLngExpression
}

type SearchArea = {
    center: LatLngExpression,
    radius: number
};

type SearchForFeaturesResponse = SearchArea[];

export function searchForFeatures(firebaseApp: FirebaseApp, request: SearchForFeaturesRequest): Promise<HttpsCallableResult<SearchForFeaturesResponse>> {
  return httpsCallable(getFunctions(firebaseApp), 'searchForFeatures')(request) as Promise<HttpsCallableResult<SearchForFeaturesResponse>>
} 
