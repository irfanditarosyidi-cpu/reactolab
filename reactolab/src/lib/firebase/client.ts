import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Firebase web config is public by design (protected by Security Rules).
// See README for how to point this at a different Firebase project.
export const firebaseConfig = {
  apiKey: "AIzaSyA7oONQCQm_Ud6FQYkzGGGi8FBZQpizBII",
  authDomain: "reactolab-496a1.firebaseapp.com",
  databaseURL:
    "https://reactolab-496a1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "reactolab-496a1",
  storageBucket: "reactolab-496a1.firebasestorage.app",
  messagingSenderId: "326602121437",
  appId: "1:326602121437:web:a76ae2d1a9accc47d73b34",
  measurementId: "G-74EG7YD8MG",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

export let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export default app;
