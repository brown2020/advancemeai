"use client";

import { createContext, useContext, useState } from "react";

type AuthContextType = {
  isLoggedIn: boolean;
  login: (
    method: "google" | "password",
    credentials?: { email: string; password: string }
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = async (
    method: "google" | "password",
    credentials?: { email: string; password: string }
  ) => {
    // Implement your login logic here based on method
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`Logging in with ${method}`, credentials);
        setIsLoggedIn(true);
        resolve();
      }, 1000);
    });
  };

  const logout = async () => {
    return new Promise<void>((resolve) => {
      setIsLoggedIn(false);
      resolve();
    });
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
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
