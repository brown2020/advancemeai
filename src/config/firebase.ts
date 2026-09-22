import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
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

function hasClientConfig(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

function getFirebaseApp(): FirebaseApp {
  if (!hasClientConfig()) {
    throw new Error(
      "Firebase client config is missing. Set NEXT_PUBLIC_FIREBASE_* env vars (or GitHub Actions secrets in CI)."
    );
  }
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

function lazyService<T extends object>(factory: () => T): T {
  let instance: T | undefined;
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      if (!instance) instance = factory();
      const value = Reflect.get(instance as object, prop, receiver);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

/** Lazily initialized so `next build` can prerender when CI secrets are unset. */
export const auth: Auth = lazyService(() => getAuth(getFirebaseApp()));
export const db: Firestore = lazyService(() => getFirestore(getFirebaseApp()));
export const storage: FirebaseStorage = lazyService(() =>
  getStorage(getFirebaseApp())
);
