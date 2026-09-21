import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  ConfirmationResult,
  UserCredential,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBd0z0vDIEllSRcLX7kupMYO1aAbj72CDs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "medipass-admin.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "medipass-admin",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "medipass-admin.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "58161930294",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:58161930294:web:16846f1b671805db877897",
  measurementId: "G-J44L9CYHM5"
};

// Initialize Firebase App & Auth
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export { RecaptchaVerifier, signInWithPhoneNumber, signInWithEmailAndPassword };
export type { ConfirmationResult, UserCredential };
