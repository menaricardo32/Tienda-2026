import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Note: In a real production app, these should be in .env files
const firebaseConfig = {
  apiKey: "AIzaSyD_W4ECytP0gdLjwH_qf2UHm0tptWgBb10",
  authDomain: "tiendas-online-c8a45.firebaseapp.com",
  projectId: "tiendas-online-c8a45",
  storageBucket: "tiendas-online-c8a45.firebasestorage.app",
  messagingSenderId: "795052982545",
  appId: "1:795052982545:web:6c1cfa784114dff028ccb0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
