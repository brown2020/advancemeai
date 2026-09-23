"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, Calendar, GraduationCap, School, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getUserProfileByUsername } from "@/services/userProfileService";
import { getPublicFlashcardSets } from "@/services/flashcardService";
import type { UserProfile } from "@/types/user-profile";
import type { FlashcardSet } from "@/types/flashcard";
import { logger } from "@/utils/logger";
import {
  EmptyState,
  PageContainer,
  SectionHeading,
} from "@/components/common/UIComponents";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button-variants";
import { SetGrid, SetGridSkeleton } from "@/components/flashcards/library/SetGrid";

type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: UserProfile; sets: FlashcardSet[] };

export default function UserProfileClient() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!username) return;
    let isMounted = true;

    const loadProfile = async () => {
      setState({ status: "loading" });
      try {
        const profile = await getUserProfileByUsername(username);
        if (!isMounted) return;
        if (!profile) {
          setState({ status: "not-found" });
          return;
        }
        const allPublic = await getPublicFlashcardSets();
        if (!isMounted) return;
        setState({
          status: "ready",
          profile,
          sets: allPublic.filter((s) => s.userId === profile.uid),
        });
      } catch (err) {
        logger.error("Failed to load profile", err);
        if (isMounted) {
          setState({ status: "error", message: "Failed to load user profile" });
        }
      }
    };

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, [username]);

  if (state.status === "loading") {
    return (
      <PageContainer>
        <div
          className="mb-10 flex items-center gap-4"
          aria-busy="true"
          aria-label="Loading profile"
        >
          <Skeleton className="size-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <SetGridSkeleton count={4} />
      </PageContainer>
    );
  }

  if (state.status !== "ready") {
    return (
      <PageContainer width="narrow">
        <EmptyState
          icon={<User />}
          title={state.status === "not-found" ? "User not found" : "Couldn't load profile"}
          message={
            state.status === "not-found"
              ? `@${username} doesn't exist or has a private profile.`
              : state.message
          }
          action={
            <Link href="/search" className={buttonVariants({ variant: "outline" })}>
              Search flashcards
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const { profile, sets } = state;
  const name = profile.displayName || username;
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <PageContainer>
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-primary">
          {profile.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={name}
              width={80}
              height={80}
              className="size-20 object-cover"
              unoptimized
            />
          ) : (
            <User className="size-9" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {name}
            </h1>
            {profile.role === "teacher" && (
              <Badge>
                <GraduationCap aria-hidden />
                Teacher
              </Badge>
            )}
          </div>
          {profile.username && (
            <p className="text-muted-foreground">@{profile.username}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4" aria-hidden />
              Joined {memberSince}
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <BookOpen className="size-4" aria-hidden />
              {sets.length} public {sets.length === 1 ? "set" : "sets"}
            </span>
            {profile.school && (
              <span className="inline-flex items-center gap-1.5">
                <School className="size-4" aria-hidden />
                {profile.school}
              </span>
            )}
          </div>
        </div>
      </header>

      <section>
        <SectionHeading title="Public sets" icon={<BookOpen />} />
        <SetGrid
          sets={sets}
          viewerUserId={user?.uid}
          empty={
            <EmptyState
              icon={<BookOpen />}
              title="No public sets yet"
              message={`${name} hasn't shared any flashcard sets yet.`}
            />
          }
        />
      </section>
    </PageContainer>
  );
}
