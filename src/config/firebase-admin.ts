import {
  cert,
  getApps,
  initializeApp as initializeAdminApp,
  AppOptions,
} from "firebase-admin/app";
import { getAuth as getAdminAuth, type Auth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore, type Firestore } from "firebase-admin/firestore";
import { resolveAdminCredentials } from "./firebase-admin-credentials";

let initialized = false;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

/**
 * Attempts to initialize Firebase Admin SDK with service account credentials
 * Safe to call multiple times - initializes only once
 */
function tryInitAdmin(): void {
  if (initialized && cachedAuth && cachedDb) return;

  const credentials = resolveAdminCredentials();

  if (!credentials) {
    initialized = true; // Avoid re-checking repeatedly
    return; // Do not throw at build time; routes will handle missing creds
  }

  if (!getApps().length) {
    const options: AppOptions = {
      credential: cert(credentials),
      projectId: credentials.projectId,
    };
    initializeAdminApp(options);
  }

  cachedAuth = getAdminAuth();
  cachedDb = getAdminFirestore();
  initialized = true;
}

/**
 * Returns Firebase Admin Auth instance if initialized, null otherwise
 * @returns Admin Auth instance or null
 */
export function getAdminAuthOptional(): Auth | null {
  tryInitAdmin();
  return cachedAuth;
}

/**
 * Returns Firebase Admin Firestore instance if initialized, null otherwise
 * @returns Admin Firestore instance or null
 */
export function getAdminDbOptional(): Firestore | null {
  tryInitAdmin();
  return cachedDb;
}
