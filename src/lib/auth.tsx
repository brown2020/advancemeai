"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@/firebase/firebaseConfig";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

type User = {
  uid: string;
  email: string | null;
};

type SignInMethod = "google" | "password" | "resetPassword";

type AuthContextType = {
  user: User | null;
  signIn: (
    method: SignInMethod,
    credentials?: {
      email: string;
      password?: string;
    }
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (
    method: SignInMethod,
    credentials?: {
      email: string;
      password?: string;
    }
  ) => {
    try {
      let result;
      if (method === "google") {
        result = await signInWithPopup(auth, googleProvider);
      } else if (method === "password" && credentials?.password) {
        result = await signInWithEmailAndPassword(
          auth,
          credentials.email,
          credentials.password
        );
      } else if (method === "resetPassword" && credentials?.email) {
        await sendPasswordResetEmail(auth, credentials.email);
        return;
      }
      // Set session cookie
      const idToken = await result?.user?.getIdToken();
      if (idToken) {
        document.cookie = `session=${idToken}; path=/`;
      }
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Remove session cookie
      document.cookie =
        "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
