"use client";

import { useAuth } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import { Button } from "@/components/ui/button";
import {
  ErrorDisplay,
  PageContainer,
  PageHeader,
  SectionContainer,
} from "@/components/common/UIComponents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES, STORAGE_KEYS, THEMES } from "@/constants/appConstants";
import { useUserFlashcards } from "@/hooks/useFlashcards";
import { useFlashcardFolders } from "@/hooks/useFlashcardFolders";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import { listFlashcardStudyProgressForUser } from "@/services/flashcardStudyService";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Copy, LogOut, Mail, Shield, Sparkles, User as UserIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export default function ProfilePage() {
  const { user, signOut, sendPasswordReset } = useAuth();
  const userId = user?.uid ?? null;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  const { sets: yourSets, isLoading: isSetsLoading } = useUserFlashcards({
    refreshInterval: 0,
    prefetchSets: false,
  });

  const { folders, isLoading: isFoldersLoading } = useFlashcardFolders(userId);

  const hydrateProgress = useFlashcardStudyStore((s) => s.hydrateProgress);
  const starredBySetId = useFlashcardStudyStore((s) => s.starredBySetId);
  const progressByUserSetKey = useFlashcardStudyStore(
    (s) => s.progressByUserSetKey
  );

  const {
    preferences,
    update,
    save,
    isLoading: isPrefLoading,
    error: prefError,
  } = useUserPreferences(userId);
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setStatus(null);
      await signOut();
      router.push("/");
    } catch {
      setError("Failed to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    listFlashcardStudyProgressForUser(userId)
      .then((rows) => {
        if (!isMounted) return;
        rows.forEach((row) => hydrateProgress(userId, row.setId, row.masteryByCardId));
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [hydrateProgress, userId]);

  // Keep the ThemeProvider in sync with loaded preferences (but don't fight the user while editing).
  useEffect(() => {
    if (!preferences?.theme) return;
    setTheme(preferences.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.theme]);

  const stats = useMemo(() => {
    if (!userId) {
      return {
        setCount: 0,
        folderCount: 0,
        masteredTermsCount: 0,
        starredTermsCount: 0,
      };
    }

    const setCount = yourSets.length;
    const folderCount = folders.length;

    const starredTermsCount = Object.values(starredBySetId).reduce(
      (sum, byCardId) => sum + Object.keys(byCardId ?? {}).length,
      0
    );

    const progressKeyPrefix = `${userId}:`;
    const masteryBySet = Object.entries(progressByUserSetKey).filter(([k]) =>
      k.startsWith(progressKeyPrefix)
    );
    const masteredTermsCount = masteryBySet.reduce((sum, [, v]) => {
      const mastery = v?.masteryByCardId ?? {};
      return (
        sum +
        Object.values(mastery).reduce<number>(
          (s, m) => s + (m === 3 ? 1 : 0),
          0
        )
      );
    }, 0);

    return { setCount, folderCount, masteredTermsCount, starredTermsCount };
  }, [folders.length, progressByUserSetKey, starredBySetId, userId, yourSets.length]);

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

  const initials = (user.email?.[0] ?? "U").toUpperCase();

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied to clipboard.");
      setTimeout(() => setStatus(null), 2000);
    } catch {
      setStatus("Copy failed.");
      setTimeout(() => setStatus(null), 2000);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Profile" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{user.email ?? "No email"}</div>
                <div className="text-sm text-muted-foreground">Advance.me account</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">EMAIL</div>
                  <div className="text-sm font-medium truncate">{user.email ?? "—"}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyText(user.email ?? "")}
                  disabled={!user.email}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">USER ID</div>
                  <div className="text-sm font-medium truncate">{user.uid}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyText(user.uid)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            {status && (
              <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
                {status}
              </p>
            )}

            {(error || prefError) && (
              <div className="mt-4">
                <ErrorDisplay message={error || prefError || "Something went wrong"} />
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => router.push(ROUTES.FLASHCARDS.INDEX)}
                variant="outline"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Go to Flashcards Library
              </Button>
              <Button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                variant="destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoading ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <SectionContainer title="Your stats">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Sets"
                value={isSetsLoading ? null : stats.setCount}
                icon={<Sparkles className="h-4 w-4" />}
              />
              <StatTile
                label="Folders"
                value={isFoldersLoading ? null : stats.folderCount}
                icon={<Sparkles className="h-4 w-4" />}
              />
              <StatTile
                label="Mastered"
                value={stats.masteredTermsCount}
                icon={<Sparkles className="h-4 w-4" />}
              />
              <StatTile
                label="Starred"
                value={stats.starredTermsCount}
                icon={<Sparkles className="h-4 w-4" />}
              />
            </div>
          </SectionContainer>

          <SectionContainer title="Preferences">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <select
                  id="theme"
                  className={cn(
                    "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                  value={preferences.theme}
                  onChange={(e) => {
                    const next = e.target.value as typeof preferences.theme;
                    update({ theme: next });
                    setTheme(next);
                    try {
                      localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(next));
                    } catch {}
                  }}
                >
                  <option value={THEMES.SYSTEM}>System</option>
                  <option value={THEMES.LIGHT}>Light</option>
                  <option value={THEMES.DARK}>Dark</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  System follows your device preference.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-notifs">Email notifications</Label>
                <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Product updates</div>
                    <div className="text-xs text-muted-foreground">
                      Receive occasional updates about new study features.
                    </div>
                  </div>
                  <input
                    id="email-notifs"
                    type="checkbox"
                    className="h-4 w-4 rounded border border-input"
                    checked={preferences.emailNotifications}
                    onChange={(e) => update({ emailNotifications: e.target.checked })}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Preferences are saved to your account.
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  setError(null);
                  setStatus(null);
                  try {
                    await save();
                    setStatus("Preferences saved.");
                    setTimeout(() => setStatus(null), 2000);
                  } catch {
                    // handled by hook error message
                  }
                }}
                disabled={isPrefLoading}
                isLoading={isPrefLoading}
              >
                Save
              </Button>
            </div>
          </SectionContainer>

          <SectionContainer title="Security">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Reset password</div>
                  <div className="text-sm text-muted-foreground">
                    We’ll email you a password reset link.
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!user.email) return;
                  setError(null);
                  setStatus(null);
                  try {
                    await sendPasswordReset(user.email);
                    setStatus("Password reset email sent.");
                    setTimeout(() => setStatus(null), 2500);
                  } catch {
                    setError("Failed to send password reset email. Please try again.");
                  }
                }}
                disabled={!user.email}
              >
                Send reset email
              </Button>
            </div>
          </SectionContainer>
        </div>
      </div>
    </PageContainer>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | null;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label.toUpperCase()}</div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold">
        {value === null ? <Skeleton className="h-8 w-16" /> : value}
      </div>
    </div>
  );
}
