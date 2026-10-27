import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAGDIzBr6-VEuyv47yNqkli4rzkQsX4koo",
  authDomain: "motovision-3d8ba.firebaseapp.com",
  projectId: "motovision-3d8ba",
  storageBucket: "motovision-3d8ba.firebasestorage.app",
  messagingSenderId: "1033979305991",
  appId: "1:1033979305991:web:b37b0000a5be5871b74aa2",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

export const storage = getStorage(app);