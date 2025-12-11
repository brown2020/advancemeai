"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

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
    <Button
      id="auth-button"
      onClick={handleClick}
      variant={buttonStyle}
      isLoading={isLoading}
    >
      {isLoading ? "Loading..." : user ? "Sign Out" : "Sign In"}
    </Button>
  );
}
