import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "learningo-c9ac4.firebaseapp.com",
  projectId: "learningo-c9ac4",
  storageBucket: "learningo-c9ac4.firebasestorage.app",
  messagingSenderId: "428251024384",
  appId: "1:428251024384:web:861cdc66cf33b1b4389ce5"
};

// Without an API key (a build made without client/.env, for example in CI)
// getAuth() throws on import and the whole site renders nothing. Keep the site
// working instead: only "Sign in with Google" is unavailable, and says so.
export const firebaseConfigured = Boolean(firebaseConfig.apiKey);
export const auth = firebaseConfigured ? getAuth(initializeApp(firebaseConfig)) : null;
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  if (!auth) {
    const err = new Error("Google sign-in isn't available right now. Please try again later or contact us.");
    err.code = "auth/not-configured";
    throw err;
  }
  return signInWithPopup(auth, googleProvider);
}
