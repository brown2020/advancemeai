"use client";

import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signOut();
      router.push("/");
    } catch {
      setError("Failed to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        <SignInGate
          title="Sign in to view your Profile"
          description="Access your account settings, track your progress, and manage your preferences."
          icon={SignInGateIcons.profile}
          buttonStyle="profile"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <p className="mb-2">
          <span className="font-medium">Email:</span> {user.email}
        </p>
        <p className="mb-4">
          <span className="font-medium">User ID:</span> {user.uid}
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <Button
          onClick={handleSignOut}
          disabled={isLoading}
          variant="outline"
          className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
        >
          {isLoading ? "Signing out..." : "Sign Out"}
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" className="rounded text-blue-600" />
            <span>Receive email notifications</span>
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" className="rounded text-blue-600" />
            <span>Dark mode</span>
          </label>
        </div>
        <Button variant="practice">Save Preferences</Button>
      </div>
    </div>
  );
}
