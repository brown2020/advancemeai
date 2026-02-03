"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  BookOpen,
  Calendar,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";
import { getUserProfileByUsername } from "@/services/userProfileService";
import { getPublicFlashcardSets } from "@/services/flashcardService";
import type { UserProfile } from "@/types/user-profile";
import type { FlashcardSet } from "@/types/flashcard";
import { FlashcardSetCard } from "@/components/flashcards/FlashcardSetCard";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [publicSets, setPublicSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const userProfile = await getUserProfileByUsername(username);
        if (!userProfile) {
          setError("User not found");
          return;
        }

        setProfile(userProfile);

        // Load user's public flashcard sets
        const sets = await getPublicFlashcardSets();
        const userSets = sets.filter((s) => s.userId === userProfile.uid);
        setPublicSets(userSets);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Failed to load user profile");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [username]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="text-center py-12">
          <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-muted-foreground">
            The user @{username} doesn&apos;t exist or has a private profile.
          </p>
        </div>
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      {/* Profile Header */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.displayName || username}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-primary" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold truncate">
                {profile.displayName || username}
              </h1>
              {profile.role === "teacher" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <GraduationCap className="h-3 w-3" />
                  Teacher
                </span>
              )}
            </div>

            {profile.username && (
              <p className="text-muted-foreground mb-2">@{profile.username}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined {memberSince}
              </span>
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {publicSets.length} public{" "}
                {publicSets.length === 1 ? "set" : "sets"}
              </span>
              {profile.school && <span>{profile.school}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Public Sets */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Public Flashcard Sets</h2>

        {publicSets.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {profile.displayName || username} hasn&apos;t shared any public
              flashcard sets yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {publicSets.map((set) => (
              <FlashcardSetCard key={set.id} set={set} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
