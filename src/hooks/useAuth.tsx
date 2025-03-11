"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  AuthError as FirebaseAuthError,
} from "firebase/auth";
import { auth, googleProvider } from "@/config/firebase";
import { AppError, ErrorCode } from "@/utils/errors";
import { logger } from "@/utils/logger";

type User = {
  uid: string;
  email: string | null;
};

type SignInMethod = "google" | "password" | "resetPassword";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (
    method: SignInMethod,
    credentials?: {
      email: string;
      password?: string;
    }
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Converts Firebase auth errors to AppErrors
 */
function handleAuthError(error: unknown): AppError {
  if (error && typeof error === "object" && "code" in error) {
    const authError = error as FirebaseAuthError;
    // Map Firebase error codes to our error codes
    switch (authError.code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
        return new AppError(
          "Invalid email or password",
          ErrorCode.AUTHENTICATION,
          401
        );
      case "auth/email-already-in-use":
        return new AppError("Email already in use", ErrorCode.CONFLICT, 409);
      case "auth/weak-password":
        return new AppError("Password is too weak", ErrorCode.VALIDATION, 400);
      case "auth/invalid-email":
        return new AppError("Invalid email address", ErrorCode.VALIDATION, 400);
      case "auth/user-disabled":
        return new AppError(
          "This account has been disabled",
          ErrorCode.AUTHENTICATION,
          403
        );
      case "auth/popup-closed-by-user":
        return new AppError(
          "Sign in was cancelled",
          ErrorCode.AUTHENTICATION,
          401
        );
      default:
        return new AppError(
          `Authentication error: ${authError.message}`,
          ErrorCode.AUTHENTICATION,
          401
        );
    }
  }

  if (error instanceof Error) {
    return new AppError(error.message, ErrorCode.AUTHENTICATION, 401);
  }

  return new AppError(
    "An unknown authentication error occurred",
    ErrorCode.AUTHENTICATION,
    401
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        logger.info(`User authenticated: ${firebaseUser.uid}`);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
      } else {
        logger.info("User signed out");
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(
    async (
      method: SignInMethod,
      credentials?: { email: string; password?: string }
    ) => {
      try {
        if (method === "google") {
          logger.info("Attempting Google sign in");
          await signInWithPopup(auth, googleProvider);
        } else if (method === "password" && credentials?.password) {
          logger.info(
            `Attempting email/password sign in for: ${credentials.email}`
          );
          await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
        } else if (method === "resetPassword" && credentials?.email) {
          logger.info(`Sending password reset email to: ${credentials.email}`);
          await sendPasswordResetEmail(auth, credentials.email);
        }
      } catch (error) {
        logger.error("Error during sign in:", error);
        throw handleAuthError(error);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      logger.info("Signing out user");
      await firebaseSignOut(auth);
    } catch (error) {
      logger.error("Error signing out:", error);
      throw handleAuthError(error);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      signIn,
      signOut,
    }),
    [user, isLoading, signIn, signOut]
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
