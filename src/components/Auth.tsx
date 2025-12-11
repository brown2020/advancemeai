"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/utils/cn";

type AuthProps = {
  buttonStyle?: "default" | "practice" | "flashcard" | "quiz" | "profile";
};

export default function Auth({ buttonStyle = "default" }: AuthProps) {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = async () => {
    if (user) {
      try {
        setIsLoading(true);
        await signOut();
      } catch (error) {
        // Sign out errors are non-critical, just log them
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error("Failed to sign out:", error);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Redirect to sign-in page with return URL
      router.push(`/auth/signin?returnTo=${encodeURIComponent(pathname)}`);
    }
  };

  return (
    <Button id="auth-button" onClick={handleClick} variant={buttonStyle}>
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </span>
      ) : user ? (
        "Sign Out"
      ) : (
        "Sign In"
      )}
    </Button>
  );
}
