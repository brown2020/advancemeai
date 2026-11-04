"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, Plus, Search, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GroupCard, GroupCardSkeleton } from "@/components/groups/GroupCard";
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
import { signInHref } from "@/constants/appConstants";

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

function filterClasses(classes: Class[], searchQuery: string): Class[] {
  const query = searchQuery.trim().toLowerCase();
  return classes.filter((cls) => cls.name.toLowerCase().includes(query));
}

function emptyClassMessage(canCreateClass: boolean): string {
  if (canCreateClass) return "Create a class, then share its code so students can join.";
  return "Ask your teacher for a class code to join.";
}

function classListAction(canCreateClass: boolean) {
  if (canCreateClass) return createLink;
  return joinLink;
}

function GroupsHeader({ canCreateClass }: { canCreateClass: boolean }) {
  return (
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
          {canCreateClass ? createLink : null}
        </>
      }
    />
  );
}

function ClassSearch({
  searchQuery,
  onSearchQuery,
}: {
  searchQuery: string;
  onSearchQuery: (value: string) => void;
}) {
  return (
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
        onChange={(e) => onSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}

function ClassSkeletons() {
  return (
    <CardGrid>
      {["c1", "c2", "c3"].map((id) => (
        <GroupCardSkeleton key={id} />
      ))}
    </CardGrid>
  );
}

function ClassList({
  isLoading,
  classes,
  filteredClasses,
  loadError,
  searchQuery,
  canCreateClass,
  currentUserId,
}: {
  isLoading: boolean;
  classes: Class[];
  filteredClasses: Class[];
  loadError: string | null;
  searchQuery: string;
  canCreateClass: boolean;
  currentUserId: string;
}) {
  if (isLoading) return <ClassSkeletons />;
  if (classes.length === 0 && loadError) return null;
  if (classes.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="No classes yet"
        message={emptyClassMessage(canCreateClass)}
        action={classListAction(canCreateClass)}
      />
    );
  }
  if (filteredClasses.length === 0) {
    return (
      <EmptyState
        icon={<Search />}
        title="No matches"
        message={`Nothing matches "${searchQuery.trim()}". Try a different search.`}
      />
    );
  }
  return (
    <CardGrid>
      {filteredClasses.map((cls) => (
        <GroupCard key={cls.id} group={cls} currentUserId={currentUserId} />
      ))}
    </CardGrid>
  );
}

export default function GroupsPageClient() {
  const { user, userProfile, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const canCreateClass = isTeacher(userProfile);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    const loadClasses = async () => {
      try {
        const userClasses = await classService.getUserClasses(user.uid);
        if (cancelled) return;
        setClasses(userClasses);
      } catch (error) {
        if (cancelled) return;
        logger.error("Failed to load classes:", error);
        setLoadError("Could not load your classes. Please refresh to try again.");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    void loadClasses();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (!authLoading && !user) {
    redirect(signInHref("/groups"));
  }

  const filteredClasses = filterClasses(classes, searchQuery);
  const isLoading = authLoading || loading;
  const showSearch = !isLoading && classes.length > 0;

  return (
    <PageContainer>
      <GroupsHeader canCreateClass={canCreateClass} />

      {loadError ? <ErrorDisplay message={loadError} /> : null}

      {showSearch ? (
        <ClassSearch searchQuery={searchQuery} onSearchQuery={setSearchQuery} />
      ) : null}

      <ClassList
        isLoading={isLoading}
        classes={classes}
        filteredClasses={filteredClasses}
        loadError={loadError}
        searchQuery={searchQuery}
        canCreateClass={canCreateClass}
        currentUserId={user?.uid ?? ""}
      />
    </PageContainer>
  );
}
