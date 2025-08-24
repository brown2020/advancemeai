import {
  cert,
  getApps,
  initializeApp as initializeAdminApp,
  AppOptions,
} from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

let initialized = false;
let cachedAuth: ReturnType<typeof getAdminAuth> | null = null;
let cachedDb: ReturnType<typeof getAdminFirestore> | null = null;

function tryInitAdmin(): void {
  if (initialized && (cachedAuth || cachedDb)) return;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY || "";
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    initialized = true; // Avoid re-checking repeatedly
    return; // Do not throw at build time; routes will handle missing creds
  }

  if (!getApps().length) {
    const options: AppOptions = {
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    };
    initializeAdminApp(options);
  }

  cachedAuth = getAdminAuth();
  cachedDb = getAdminFirestore();
  initialized = true;
}

export function getAdminAuthOptional() {
  tryInitAdmin();
  return cachedAuth;
}

export function getAdminDbOptional() {
  tryInitAdmin();
  return cachedDb;
}
