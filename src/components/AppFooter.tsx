"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/flashcards", label: "Flashcards" },
  { href: "/practice", label: "SAT Prep" },
  { href: "/quizzes", label: "Quizzes" },
  { href: "/search", label: "Explore" },
];

export function AppFooter() {
  const { user, isLoading, signOut } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  // Clears a stuck session cookie / cached auth state for signed-out visitors.
  const handleReset = async () => {
    try {
      setIsResetting(true);
      await signOut();
      router.push("/");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-semibold text-foreground">Advance.me</span> · Study
          smarter, score higher.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
          {!isLoading && !user && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting}
              className="hover:text-foreground disabled:opacity-50"
            >
              {isResetting ? "Resetting..." : "Reset sign-in"}
            </button>
          )}
        </nav>
      </div>
    </footer>
  );
}
