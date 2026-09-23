import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";
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

/**
 * Local development against the Firebase Emulator Suite (`firebase emulators:start`).
 * Opt-in only; the server side follows FIRESTORE_EMULATOR_HOST /
 * FIREBASE_AUTH_EMULATOR_HOST, which firebase-admin reads natively.
 */
const useEmulators =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

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

/**
 * Lazy real SDK instances (not Proxies for Firestore/Storage).
 * Modular Firestore/Storage APIs use instanceof checks, so a Proxy around
 * `db`/`storage` breaks `collection()` / `ref()`. Auth stays a Proxy because
 * call sites use property access. Init remains deferred so `next build`
 * prerender works when CI secrets are empty.
 */
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let storageInstance: FirebaseStorage | undefined;

function getClientAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
    if (useEmulators) {
      connectAuthEmulator(authInstance, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
    }
  }
  return authInstance;
}

export function getClientDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
    if (useEmulators) connectFirestoreEmulator(dbInstance, "127.0.0.1", 8080);
  }
  return dbInstance;
}

export function getClientStorage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(getFirebaseApp());
    if (useEmulators) connectStorageEmulator(storageInstance, "127.0.0.1", 9199);
  }
  return storageInstance;
}

/** Lazy Auth via Proxy (property access + bound methods). */
export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const instance = getClientAuth();
    const value = Reflect.get(instance as object, prop, instance);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});
