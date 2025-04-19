"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { auth } from "@/firebase/firebaseConfig";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  AuthError as FirebaseAuthError,
  onAuthStateChanged,
} from "firebase/auth";
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
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  const googleProvider = useMemo(() => new GoogleAuthProvider(), []);

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

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      logger.info(`Attempting to create account for: ${email}`);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const idToken = await result.user?.getIdToken();
      if (idToken) {
        document.cookie = `session=${idToken}; path=/`;
      }
    } catch (error) {
      logger.error("Error during sign up:", error);
      throw handleAuthError(error);
    }
  }, []);

  const signIn = useCallback(
    async (
      method: SignInMethod,
      credentials?: { email: string; password?: string }
    ) => {
      try {
        let result;
        if (method === "google") {
          logger.info("Attempting Google sign in");
          result = await signInWithPopup(auth, googleProvider);
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
          document.cookie = `session=${idToken}; path=/`;
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
      document.cookie =
        "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
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
      signUp,
      signOut,
    }),
    [user, isLoading, signIn, signUp, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
