"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import {
  ErrorDisplay,
  PageContainer,
  PageHeader,
} from "@/components/common/UIComponents";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useTheme } from "@/components/theme/ThemeProvider";
import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard";
import { ProfileStatsGrid } from "@/components/profile/ProfileStatsGrid";
import { PreferencesCard } from "@/components/profile/PreferencesCard";
import { AppearanceCard } from "@/components/profile/AppearanceCard";
import {
  AccountCard,
  type VerificationAction,
} from "@/components/profile/AccountCard";
import { useProfileStats } from "@/components/profile/useProfileStats";
import { useFlashStatus } from "@/components/profile/useFlashStatus";

const PAGE_TITLE = "Profile";
const PAGE_DESCRIPTION = "Manage your account, preferences, and appearance.";

export default function ProfileClient({
  authIsGuaranteed = false,
}: {
  authIsGuaranteed?: boolean;
}) {
  const {
    user,
    userProfile,
    isLoading: isAuthLoading,
    signOut,
    sendPasswordReset,
    sendVerificationEmail,
    refreshAuthState,
  } = useAuth();
  const userId = user?.uid ?? null;
  const router = useRouter();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [verificationAction, setVerificationAction] =
    useState<VerificationAction>(null);
  const [error, setError] = useState<string | null>(null);
  const { status, flash, clear: clearStatus } = useFlashStatus();

  const stats = useProfileStats(userId);
  const {
    preferences,
    update,
    save,
    hasLoaded: prefsLoaded,
    isLoading: isPrefLoading,
    error: prefError,
  } = useUserPreferences(userId);
  const { theme, setTheme } = useTheme();

  // Apply the saved theme once, when the account copy of preferences arrives.
  // Deps intentionally omit preferences.theme: later edits flow the other way.
  useEffect(() => {
    if (prefsLoaded) setTheme(preferences.theme);
  }, [prefsLoaded]);

  // Mirror theme changes from the ThemeSwitcher into the unsaved preferences.
  const previousTheme = useRef(theme);
  useEffect(() => {
    if (previousTheme.current === theme) return;
    previousTheme.current = theme;
    update({ theme });
  }, [theme, update]);

  const runAction = async (
    action: () => Promise<void>,
    success: string,
    failure: string
  ) => {
    setError(null);
    clearStatus();
    try {
      await action();
      flash(success);
    } catch {
      setError(failure);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setError(null);
      clearStatus();
      await signOut();
      router.push("/");
    } catch {
      setError("Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleVerification = async (kind: "send" | "refresh") => {
    setVerificationAction(kind);
    try {
      await runAction(
        kind === "send" ? sendVerificationEmail : refreshAuthState,
        kind === "send" ? "Verification email sent." : "Email status refreshed.",
        kind === "send"
          ? "Failed to send verification email. Please try again."
          : "Could not refresh your email status. Please try again."
      );
    } finally {
      setVerificationAction(null);
    }
  };

  const handleSavePreferences = async () => {
    setError(null);
    clearStatus();
    try {
      await save();
      flash("Preferences saved.", 2000);
    } catch {
      // The hook exposes its own error message (prefError).
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash("Copied to clipboard.", 2000);
    } catch {
      flash("Copy failed.", 2000);
    }
  };

  if (isAuthLoading) {
    return (
      <PageContainer width="narrow">
        <PageHeader title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
        <div className="space-y-6" aria-busy="true">
          <span className="sr-only">
            {authIsGuaranteed ? "Loading profile…" : "Checking your session…"}
          </span>
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer width="narrow">
        <PageHeader title={PAGE_TITLE} />
        <SignInGate
          title="Sign in to view your Profile"
          description={
            authIsGuaranteed
              ? "Your session expired. Sign in again to view your profile."
              : "Access your account settings, track your progress, and manage your preferences."
          }
          icon={SignInGateIcons.profile}
        />
      </PageContainer>
    );
  }

  const shownError = error || prefError;

  return (
    <PageContainer width="narrow">
      <PageHeader title={PAGE_TITLE} description={PAGE_DESCRIPTION} />

      <p className="sr-only" aria-live="polite">
        {status ?? ""}
      </p>
      {status && (
        <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-8">
          <p className="animate-slide-up rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lift">
            {status}
          </p>
        </div>
      )}
      {shownError && <ErrorDisplay message={shownError} />}

      <div className="space-y-6">
        <ProfileInfoCard user={user} profile={userProfile} onCopy={handleCopy} />
        <ProfileStatsGrid stats={stats} />
        <AppearanceCard />
        <PreferencesCard
          emailNotifications={preferences.emailNotifications}
          onEmailNotificationsChange={(value) =>
            update({ emailNotifications: value })
          }
          onSave={handleSavePreferences}
          isSaving={isPrefLoading}
        />
        <AccountCard
          email={user.email}
          isPasswordUser={user.isPasswordUser}
          emailVerified={user.emailVerified}
          verificationAction={verificationAction}
          isSigningOut={isSigningOut}
          onSendVerification={() => handleVerification("send")}
          onRefreshVerification={() => handleVerification("refresh")}
          onSendPasswordReset={() => {
            const email = user.email;
            if (!email) return;
            void runAction(
              () => sendPasswordReset(email),
              "Password reset email sent.",
              "Failed to send password reset email. Please try again."
            );
          }}
          onSignOut={handleSignOut}
        />
      </div>
    </PageContainer>
  );
}
