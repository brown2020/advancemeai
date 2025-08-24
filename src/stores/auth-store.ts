"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  user: { uid: string; email: string | null } | null;
  isLoading: boolean;
  setUser: (user: { uid: string; email: string | null } | null) => void;
  setLoading: (isLoading: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    { name: "auth-store" }
  )
);
