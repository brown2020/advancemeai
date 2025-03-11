"use client";

import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p>Please sign in to view your profile.</p>
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

        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
        >
          {isLoading ? "Signing out..." : "Sign Out"}
        </button>
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
        <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          Save Preferences
        </button>
      </div>
    </div>
  );
}
