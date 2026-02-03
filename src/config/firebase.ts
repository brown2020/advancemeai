import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { logger } from "@/utils/logger";
import { env } from "./env";

const firebaseConfig = {
  apiKey: env.public.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.public.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.public.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.public.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.public.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.public.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  try {
    if (!getApps().length) {
      const app = initializeApp(firebaseConfig);
      logger.info("Firebase initialized successfully");
      return app;
    }
    return getApp();
  } catch (error) {
    logger.error("Error initializing Firebase:", error);
    throw error as Error;
  }
}

const app = getFirebaseApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
