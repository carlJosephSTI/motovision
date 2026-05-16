import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWsrKI7JKHImgx0M8UhO2dTTUHIVcugo8",
  authDomain: "motovision-b0e77.firebaseapp.com",
  projectId: "motovision-b0e77",
  storageBucket: "motovision-b0e77.firebasestorage.app",
  messagingSenderId: "660268603751",
  appId: "1:660268603751:web:1164776dfc971c0b03f7c2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});