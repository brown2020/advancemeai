"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { auth } from "@/config/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithRedirect,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  getRedirectResult,
  AuthError as FirebaseAuthError,
  onAuthStateChanged,
} from "firebase/auth";
import { logger } from "@/utils/logger";
import { AuthFlowError, toAuthError } from "@/lib/auth-errors";
import type { UserRole, UserProfile } from "@/types/user-profile";
import {
  getUserProfile,
  createUserProfile,
  upsertUserProfile,
} from "@/services/userProfileService";

const ZUSTAND_PERSIST_KEYS = [
  "gamification-v1",
  "flashcard-study-v1",
  "flashcard-library-v1",
  "spaced-repetition-bookmarks",
];

type User = {
  uid: string;
  email: string | null;
  role?: UserRole;
  profile?: UserProfile | null;
};

type SignInMethod = "google" | "password" | "resetPassword";

type SignUpOptions = {
  role?: UserRole;
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signIn: (
    method: SignInMethod,
    credentials?: {
      email: string;
      password?: string;
    }
  ) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    options?: SignUpOptions
  ) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

type SessionCookieResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

function isErrorBody(body: unknown): body is { error: string } {
  return (
    !!body &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as { error?: unknown }).error === "string"
  );
}

async function readSessionError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (isErrorBody(body) && body.error.trim().length > 0) {
      return body.error;
    }
  } catch {
    // Fall through to status-based messages.
  }

  if (response.status === 401) {
    return "Your sign-in session expired. Please sign in again.";
  }

  if (response.status >= 500) {
    return "Authentication is temporarily unavailable. Please try again later.";
  }

  return "Failed to establish session. Please try again.";
}

async function createSessionCookie(
  idToken: string
): Promise<SessionCookieResult> {
  try {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (res.ok) {
      return { ok: true };
    }

    const error = await readSessionError(res);
    logger.error("Failed to create session cookie:", {
      status: res.status,
      error,
    });
    return { ok: false, error };
  } catch (error) {
    logger.error("Failed to create session cookie:", error);
    return {
      ok: false,
      error:
        "Unable to reach the sign-in server. Check your connection and try again.",
    };
  }
}

async function requireSessionCookie(idToken: string): Promise<void> {
  const session = await createSessionCookie(idToken);
  if (session.ok) return;

  try {
    await firebaseSignOut(auth);
  } catch (error) {
    logger.error("Failed to clear client auth after session error:", error);
  }

  throw new AuthFlowError(session.error);
}

async function deleteSessionCookie(): Promise<void> {
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch (error) {
    logger.error("Failed to delete session cookie:", error);
  }
}

function clearPersistedStores(): void {
  if (typeof window === "undefined") return;
  for (const key of ZUSTAND_PERSIST_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // noop
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const profileLoadRef = useRef<string | null>(null);
  const redirectHandled = useRef(false);

  const googleProvider = useMemo(() => new GoogleAuthProvider(), []);

  const loadProfile = useCallback(async (uid: string) => {
    if (profileLoadRef.current === uid) return null;
    profileLoadRef.current = uid;
    try {
      const profile = await getUserProfile(uid);
      if (profileLoadRef.current === uid) {
        setUserProfile(profile);
      }
      return profile;
    } catch (error) {
      logger.error("Failed to load user profile:", error);
      return null;
    } finally {
      if (profileLoadRef.current === uid) {
        profileLoadRef.current = null;
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.uid) {
      profileLoadRef.current = null;
      await loadProfile(user.uid);
    }
  }, [user?.uid, loadProfile]);

  // Handle redirect result from popup-blocked fallback.
  // Must run once before onAuthStateChanged so the session cookie gets set.
  useEffect(() => {
    if (redirectHandled.current) return;
    redirectHandled.current = true;

    getRedirectResult(auth)
      .then(async (result) => {
        if (!result?.user) return;
        try {
          const idToken = await result.user.getIdToken();
          await requireSessionCookie(idToken);
        } catch (error) {
          logger.error("Failed to finalize redirect sign-in session:", error);
        }
      })
      .catch((error) => {
        logger.warn("Redirect sign-in did not complete:", error);
      });
  }, []);

  // Core auth state listener. Sets loading=false exactly once after the
  // initial auth state is determined (including profile load).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        logger.info(`User authenticated: ${firebaseUser.uid}`);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
        await loadProfile(firebaseUser.uid);
      } else {
        logger.info("User signed out");
        setUser(null);
        setUserProfile(null);
        profileLoadRef.current = null;
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(
    async (email: string, password: string, options?: SignUpOptions) => {
      try {
        logger.info(`Attempting to create account for: ${email}`);
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const idToken = await result.user?.getIdToken();
        if (idToken) {
          await requireSessionCookie(idToken);
        }

        if (result.user) {
          try {
            const profile = await createUserProfile({
              uid: result.user.uid,
              email: result.user.email || email,
              displayName: result.user.displayName || undefined,
              role: options?.role || "student",
              photoUrl: result.user.photoURL || undefined,
            });
            setUserProfile(profile);
            logger.info(`User profile created with role: ${profile.role}`);
          } catch (profileError) {
            logger.error(
              "User created but profile creation failed. Will retry on next sign-in:",
              profileError
            );
          }
        }
      } catch (error) {
        logger.error("Error during sign up:", error);
        throw toAuthError(
          error,
          "An unexpected error occurred while creating your account."
        );
      }
    },
    []
  );

  const signIn = useCallback(
    async (
      method: SignInMethod,
      credentials?: { email: string; password?: string }
    ) => {
      try {
        let result;
        if (method === "google") {
          logger.info("Attempting Google sign in");
          try {
            result = await signInWithPopup(auth, googleProvider);
          } catch (popupError) {
            if (
              popupError &&
              typeof popupError === "object" &&
              "code" in popupError &&
              (popupError as FirebaseAuthError).code === "auth/popup-blocked"
            ) {
              logger.warn(
                "Popup blocked by the browser. Falling back to redirect sign-in."
              );
              await signInWithRedirect(auth, googleProvider);
              return;
            }
            throw popupError;
          }
        } else if (method === "password" && credentials?.password) {
          logger.info(
            `Attempting email/password sign in for: ${credentials.email}`
          );
          result = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
        } else if (method === "resetPassword" && credentials?.email) {
          logger.info(`Sending password reset email to: ${credentials.email}`);
          await sendPasswordResetEmail(auth, credentials.email);
          return;
        }

        const idToken = await result?.user?.getIdToken();
        if (idToken) {
          await requireSessionCookie(idToken);
        }

        if (result?.user) {
          const profile = await upsertUserProfile({
            uid: result.user.uid,
            email: result.user.email || "",
            displayName: result.user.displayName || undefined,
            role: "student",
            photoUrl: result.user.photoURL || undefined,
          });
          setUserProfile(profile);
        }
      } catch (error) {
        logger.error("Error during sign in:", error);
        throw toAuthError(error);
      }
    },
    [googleProvider]
  );

  const signOut = useCallback(async () => {
    try {
      logger.info("Signing out user");

      // Clear React state immediately so the UI reflects logged-out.
      setUser(null);
      setUserProfile(null);
      profileLoadRef.current = null;

      // 1. Delete server session cookie BEFORE Firebase sign-out.
      //    Must complete first — firebaseSignOut triggers onAuthStateChanged
      //    which may navigate before an async cookie delete finishes.
      await deleteSessionCookie();

      // 2. Sign out of Firebase.
      await firebaseSignOut(auth);

      // 3. Clear persisted Zustand stores.
      clearPersistedStores();

      // 4. Clear sessionStorage.
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }
    } catch (error) {
      logger.error("Error signing out:", error);
      // Best-effort cleanup even on error
      clearPersistedStores();
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      if (!email) return;
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      logger.error("Error sending password reset:", error);
      throw toAuthError(
        error,
        "Failed to send reset email. Please try again."
      );
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      userProfile,
      isLoading,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      refreshProfile,
    }),
    [
      user,
      userProfile,
      isLoading,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
