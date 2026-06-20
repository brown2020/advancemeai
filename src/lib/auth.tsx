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
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendEmailVerification,
  getRedirectResult,
  reload,
  AuthError as FirebaseAuthError,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { logger } from "@/utils/logger";
import {
  AuthFlowError,
  getAuthErrorCode,
  isHandledAuthError,
  toAuthError,
} from "@/lib/auth-errors";
import {
  SESSION_REQUEST_HEADER,
  SESSION_REQUEST_HEADER_VALUE,
} from "@/lib/session-request";
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

const EMAIL_LINK_STORAGE_KEY = "advanceme-auth-email-link-email";
const AUTH_EVENT_STORAGE_KEY = "advanceme-auth-event";
const AUTH_BROADCAST_CHANNEL = "advanceme-auth";

type User = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  providerIds: string[];
  isPasswordUser: boolean;
  role?: UserRole;
  profile?: UserProfile | null;
};

type SignInMethod = "google" | "password";

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
  sendEmailSignInLink: (email: string) => Promise<void>;
  isEmailLinkSignIn: (url?: string) => boolean;
  completeEmailLinkSignIn: (email?: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
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
      headers: {
        "Content-Type": "application/json",
        [SESSION_REQUEST_HEADER]: SESSION_REQUEST_HEADER_VALUE,
      },
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

function logAuthFailure(action: string, error: unknown): void {
  if (isHandledAuthError(error)) {
    logger.warn(`${action} failed:`, {
      code: getAuthErrorCode(error),
      message: toAuthError(error).message,
    });
    return;
  }

  logger.error(`${action} failed:`, error);
}

function getEmailActionSettings() {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL;

  return {
    url: `${origin ?? ""}/auth/signin`,
    handleCodeInApp: true,
  };
}

function toAppUser(firebaseUser: FirebaseUser): User {
  const providerIds = firebaseUser.providerData.map((p) => p.providerId);

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    emailVerified: firebaseUser.emailVerified,
    photoURL: firebaseUser.photoURL,
    providerIds,
    isPasswordUser: providerIds.includes("password"),
  };
}

async function deleteSessionCookie(): Promise<void> {
  try {
    await fetch("/api/auth/session", {
      method: "DELETE",
      headers: {
        [SESSION_REQUEST_HEADER]: SESSION_REQUEST_HEADER_VALUE,
      },
    });
  } catch (error) {
    logger.error("Failed to delete session cookie:", error);
  }
}

function clearSessionStorage(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.clear();
  } catch {
    // noop
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

function clearAuthStorage(): void {
  if (typeof window === "undefined") return;

  clearPersistedStores();
  clearSessionStorage();

  try {
    localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith("firebase:authUser")) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // noop
  }
}

function notifyAuthTabsSignedOut(): void {
  if (typeof window === "undefined") return;

  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
      channel.postMessage({ type: "sign_out", at: Date.now() });
      channel.close();
    }
  } catch {
    // noop
  }

  try {
    localStorage.setItem(
      AUTH_EVENT_STORAGE_KEY,
      JSON.stringify({ type: "sign_out", at: Date.now() })
    );
  } catch {
    // noop
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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

  const syncSessionForUser = useCallback(
    async (firebaseUser: FirebaseUser): Promise<void> => {
      const idToken = await firebaseUser.getIdToken(true);
      await requireSessionCookie(idToken);
      router.refresh();
    },
    [router]
  );

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
          await syncSessionForUser(result.user);
        } catch (error) {
          logger.error("Failed to finalize redirect sign-in session:", error);
        }
      })
      .catch((error) => {
        logger.warn("Redirect sign-in did not complete:", error);
      });
  }, [syncSessionForUser]);

  // Core auth state listener. Sets loading=false exactly once after the
  // initial auth state is determined (including profile load).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await syncSessionForUser(firebaseUser);
          logger.info(`User authenticated: ${firebaseUser.uid}`);
          setUser(toAppUser(firebaseUser));
          await loadProfile(firebaseUser.uid);
        } catch (error) {
          logger.error("Failed to synchronize auth session:", error);
          setUser(null);
          setUserProfile(null);
          profileLoadRef.current = null;
        }
      } else {
        logger.info("User signed out");
        setUser(null);
        setUserProfile(null);
        profileLoadRef.current = null;
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [loadProfile, syncSessionForUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleExternalSignOut = () => {
      setUser(null);
      setUserProfile(null);
      profileLoadRef.current = null;
      clearAuthStorage();
      void firebaseSignOut(auth).catch(() => {});
      router.refresh();
    };

    const channel =
      "BroadcastChannel" in window
        ? new BroadcastChannel(AUTH_BROADCAST_CHANNEL)
        : null;

    if (channel) {
      channel.onmessage = (event) => {
        if (event.data?.type === "sign_out") {
          handleExternalSignOut();
        }
      };
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_EVENT_STORAGE_KEY || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue) as { type?: string };
        if (payload.type === "sign_out") {
          handleExternalSignOut();
        }
      } catch {
        // Ignore malformed cross-tab events.
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      channel?.close();
    };
  }, [router]);

  const signUp = useCallback(
    async (email: string, password: string, options?: SignUpOptions) => {
      try {
        logger.info(`Attempting to create account for: ${email}`);
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const idToken = await result.user?.getIdToken(true);
        if (idToken) {
          await requireSessionCookie(idToken);
        }

        if (result.user) {
          setUser(toAppUser(result.user));
          try {
            await sendEmailVerification(result.user, getEmailActionSettings());
          } catch (verificationError) {
            logger.warn("Failed to send verification email after sign-up:", {
              code: getAuthErrorCode(verificationError),
            });
          }

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
        logAuthFailure("Sign up", error);
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
        }

        const idToken = await result?.user?.getIdToken(true);
        if (idToken) {
          await requireSessionCookie(idToken);
        }

        if (result?.user) {
          setUser(toAppUser(result.user));
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
        logAuthFailure("Sign in", error);
        throw toAuthError(error);
      }
    },
    [googleProvider]
  );

  const sendEmailSignInLink = useCallback(async (email: string) => {
    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        throw new AuthFlowError("Please enter your email address.");
      }

      await sendSignInLinkToEmail(auth, trimmedEmail, getEmailActionSettings());
      if (typeof window !== "undefined") {
        localStorage.setItem(EMAIL_LINK_STORAGE_KEY, trimmedEmail);
      }
    } catch (error) {
      logAuthFailure("Email link sign in", error);
      throw toAuthError(
        error,
        "Failed to send sign-in link. Please try again."
      );
    }
  }, []);

  const isEmailLinkSignInAction = useCallback((url?: string) => {
    if (typeof window === "undefined" && !url) return false;
    return isSignInWithEmailLink(auth, url ?? window.location.href);
  }, []);

  const completeEmailLinkSignIn = useCallback(
    async (email?: string) => {
      try {
        if (typeof window === "undefined") return;

        const signInUrl = window.location.href;
        if (!isSignInWithEmailLink(auth, signInUrl)) return;

        const storedEmail = localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
        const emailForLink = (email ?? storedEmail ?? "").trim();
        if (!emailForLink) {
          throw new AuthFlowError(
            "Enter the email address you used to request this sign-in link."
          );
        }

        const result = await signInWithEmailLink(auth, emailForLink, signInUrl);
        localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);

        const idToken = await result.user.getIdToken(true);
        await requireSessionCookie(idToken);
        setUser(toAppUser(result.user));

        const profile = await upsertUserProfile({
          uid: result.user.uid,
          email: result.user.email || emailForLink,
          displayName: result.user.displayName || undefined,
          role: "student",
          photoUrl: result.user.photoURL || undefined,
        });
        setUserProfile(profile);

        router.refresh();
      } catch (error) {
        logAuthFailure("Complete email link sign in", error);
        throw toAuthError(error);
      }
    },
    [router]
  );

  const sendVerificationEmail = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new AuthFlowError("Please sign in again to verify your email.");
      }

      await sendEmailVerification(currentUser, getEmailActionSettings());
    } catch (error) {
      logAuthFailure("Send verification email", error);
      throw toAuthError(
        error,
        "Failed to send verification email. Please try again."
      );
    }
  }, []);

  const refreshAuthState = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await reload(currentUser);
      await syncSessionForUser(currentUser);
      setUser(toAppUser(currentUser));
      await loadProfile(currentUser.uid);
    } catch (error) {
      logAuthFailure("Refresh auth state", error);
      throw toAuthError(
        error,
        "Could not refresh your account status. Please try again."
      );
    }
  }, [loadProfile, syncSessionForUser]);

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

      // 3. Clear persisted app and auth storage, then notify other tabs.
      clearAuthStorage();
      notifyAuthTabsSignedOut();
      router.refresh();
    } catch (error) {
      logger.error("Error signing out:", error);
      // Best-effort cleanup even on error
      clearAuthStorage();
      notifyAuthTabsSignedOut();
      router.refresh();
    }
  }, [router]);

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) return;

      logger.info(`Sending password reset email to: ${trimmedEmail}`);
      await sendPasswordResetEmail(auth, trimmedEmail);
    } catch (error) {
      logAuthFailure("Password reset", error);
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
      sendEmailSignInLink,
      isEmailLinkSignIn: isEmailLinkSignInAction,
      completeEmailLinkSignIn,
      sendVerificationEmail,
      refreshAuthState,
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
      sendEmailSignInLink,
      isEmailLinkSignInAction,
      completeEmailLinkSignIn,
      sendVerificationEmail,
      refreshAuthState,
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
