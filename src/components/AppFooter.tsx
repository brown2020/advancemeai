"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AppFooter() {
  const { user, isLoading, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>Advance.me</div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={isLoading}
          isLoading={isSigningOut}
          className="self-start sm:self-auto"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut
            ? "Signing out..."
            : user
              ? "Sign out"
              : "Reset sign-in"}
        </Button>
      </div>
    </footer>
  );
}
