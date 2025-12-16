"use client";

import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import { Button } from "@/components/ui/button";
import {
  ErrorDisplay,
  PageContainer,
  PageHeader,
  SectionContainer,
} from "@/components/common/UIComponents";

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
      <PageContainer>
        <PageHeader title="Profile" />
        <SignInGate
          title="Sign in to view your Profile"
          description="Access your account settings, track your progress, and manage your preferences."
          icon={SignInGateIcons.profile}
          buttonStyle="profile"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Your Profile" />

      <SectionContainer title="Account Information">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <p className="mb-2">
          <span className="font-medium">Email:</span> {user.email}
        </p>
        <p className="mb-4">
          <span className="font-medium">User ID:</span> {user.uid}
        </p>

        {error && <ErrorDisplay message={error} />}

        <Button
          onClick={handleSignOut}
          disabled={isLoading}
          variant="destructive"
        >
          {isLoading ? "Signing out..." : "Sign Out"}
        </Button>
      </SectionContainer>

      <SectionContainer title="Preferences">
        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" className="rounded text-primary" />
            <span>Receive email notifications</span>
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" className="rounded text-primary" />
            <span>Dark mode</span>
          </label>
        </div>
        <Button variant="secondary">Save Preferences</Button>
      </SectionContainer>
    </PageContainer>
  );
}
