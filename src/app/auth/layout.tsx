"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen">
      <AuthProvider>{children}</AuthProvider>
    </main>
  );
}
