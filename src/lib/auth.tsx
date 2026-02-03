"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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
import type { UserRole, UserProfile } from "@/types/user-profile";
import {
  getUserProfile,
  createUserProfile,
  upsertUserProfile,
} from "@/services/userProfileService";

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

/**
 * Converts Firebase auth errors to more user-friendly error messages
 */
function handleAuthError(error: unknown): Error {
  let errorMessage = "An unexpected error occurred while signing in.";

  if (error && typeof error === "object" && "code" in error) {
    const authError = error as FirebaseAuthError;
    switch (authError.code) {
      case "auth/user-not-found":
        errorMessage = "No user found with this email address.";
        break;
      case "auth/wrong-password":
        errorMessage = "Incorrect password. Please try again.";
        break;
      case "auth/invalid-email":
        errorMessage = "Invalid email format.";
        break;
      case "auth/invalid-credential":
        errorMessage =
          "Your credential is not valid. Try signing out and back in, or contact support if the problem persists.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many sign-in attempts. Please try again later.";
        break;
      case "auth/email-already-in-use":
        errorMessage = "This email is already in use by another account.";
        break;
    }
  }

  return new Error(errorMessage);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const googleProvider = useMemo(() => new GoogleAuthProvider(), []);

  // Load user profile when user changes
  const loadProfile = useCallback(async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      logger.error("Failed to load user profile:", error);
      return null;
    }
  }, []);

  // Refresh profile (can be called after profile updates)
  const refreshProfile = useCallback(async () => {
    if (user?.uid) {
      await loadProfile(user.uid);
    }
  }, [user?.uid, loadProfile]);

  useEffect(() => {
    // If the user signed in via redirect (popup blocked), complete the flow here.
    // onAuthStateChanged will reflect the user, but we must also create the server session cookie.
    let isCancelled = false;

    getRedirectResult(auth)
      .then(async (result) => {
        if (!result?.user || isCancelled) return;
        try {
          const idToken = await result.user.getIdToken();
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
        } catch (error) {
          logger.error("Failed to finalize redirect sign-in session:", error);
        }
      })
      .catch((error) => {
        // Non-fatal: user can still sign in again.
        logger.warn("Redirect sign-in did not complete:", error);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        logger.info(`User authenticated: ${firebaseUser.uid}`);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
        // Load profile after setting user
        await loadProfile(firebaseUser.uid);
      } else {
        logger.info("User signed out");
        setUser(null);
        setUserProfile(null);
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
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
        }

        // Create user profile with role
        if (result.user) {
          const profile = await createUserProfile({
            uid: result.user.uid,
            email: result.user.email || email,
            displayName: result.user.displayName || undefined,
            role: options?.role || "student",
            photoUrl: result.user.photoURL || undefined,
          });
          setUserProfile(profile);
          logger.info(`User profile created with role: ${profile.role}`);
        }
      } catch (error) {
        logger.error("Error during sign up:", error);
        throw handleAuthError(error);
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
            // Fallback to redirect if the browser blocks popups
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
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
        }

        // Upsert user profile for OAuth sign-ins
        if (result?.user) {
          const profile = await upsertUserProfile({
            uid: result.user.uid,
            email: result.user.email || "",
            displayName: result.user.displayName || undefined,
            role: "student", // Default role for OAuth, can be changed in settings
            photoUrl: result.user.photoURL || undefined,
          });
          setUserProfile(profile);
        }
      } catch (error) {
        logger.error("Error during sign in:", error);
        throw handleAuthError(error);
      }
    },
    [googleProvider]
  );

  const signOut = useCallback(async () => {
    try {
      logger.info("Signing out user");
      await firebaseSignOut(auth);
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch (error) {
      logger.error("Error signing out:", error);
      throw handleAuthError(error);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      if (!email) return;
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      logger.error("Error sending password reset:", error);
      throw handleAuthError(error);
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
