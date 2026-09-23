"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, Plus, Search, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GroupCard, GroupCardSkeleton } from "@/components/groups";
import {
  CardGrid,
  EmptyState,
  ErrorDisplay,
  PageContainer,
  PageHeader,
} from "@/components/common/UIComponents";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button-variants";
import * as classService from "@/services/classService";
import type { Class } from "@/types/class";
import { isTeacher } from "@/types/user-profile";
import { logger } from "@/utils/logger";

export default function GroupsPageClient() {
  const { user, userProfile, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const canCreateClass = isTeacher(userProfile);

  useEffect(() => {
    if (authLoading || !user) return;

    const loadClasses = async () => {
      try {
        const userClasses = await classService.getUserClasses(user.uid);
        setClasses(userClasses);
      } catch (error) {
        logger.error("Failed to load classes:", error);
        setLoadError("Could not load your classes. Please refresh to try again.");
      } finally {
        setLoading(false);
      }
    };

    void loadClasses();
  }, [user, authLoading]);

  if (!authLoading && !user) {
    redirect("/auth/signin?returnTo=/groups");
  }

  const query = searchQuery.trim().toLowerCase();
  const filteredClasses = classes.filter((cls) => cls.name.toLowerCase().includes(query));

  const joinLink = (
    <Link href="/groups/join" className={buttonVariants({ variant: "outline" })}>
      <KeyRound aria-hidden />
      Join with code
    </Link>
  );
  const createLink = (
    <Link href="/groups/create" className={buttonVariants()}>
      <Plus aria-hidden />
      New class
    </Link>
  );

  const isLoading = authLoading || loading;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={canCreateClass ? "Teacher account" : undefined}
        title="Classes"
        description={
          canCreateClass
            ? "Manage your classes and track student progress."
            : "Join classes and study with your classmates."
        }
        actions={
          <>
            {joinLink}
            {canCreateClass && createLink}
          </>
        }
      />

      {loadError && <ErrorDisplay message={loadError} />}

      {!isLoading && classes.length > 0 && (
        <div className="relative mb-6 max-w-md">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Search classes"
            placeholder="Search classes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {isLoading ? (
        <CardGrid>
          {["c1", "c2", "c3"].map((id) => (
            <GroupCardSkeleton key={id} />
          ))}
        </CardGrid>
      ) : classes.length === 0 ? (
        loadError ? null : (
          <EmptyState
            icon={<Users />}
            title="No classes yet"
            message={
              canCreateClass
                ? "Create a class, then share its code so students can join."
                : "Ask your teacher for a class code to join."
            }
            action={canCreateClass ? createLink : joinLink}
          />
        )
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="No matches"
          message={`Nothing matches "${searchQuery.trim()}". Try a different search.`}
        />
      ) : (
        <CardGrid>
          {filteredClasses.map((cls) => (
            <GroupCard key={cls.id} group={cls} currentUserId={user?.uid ?? ""} />
          ))}
        </CardGrid>
      )}
    </PageContainer>
  );
}
