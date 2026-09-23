import React from "react";
import Link from "next/link";
import { BookOpen, Globe, GraduationCap, Lock, Users } from "lucide-react";
import { cn } from "@/utils/cn";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudyGroup } from "@/types/study-group";
import { memberCountLabel } from "./group-labels";

interface GroupCardProps {
  group: StudyGroup;
  currentUserId: string;
  className?: string;
}

/** Card for a class or study group; the whole card links to its detail page. */
export const GroupCard = React.memo(function GroupCard({
  group,
  currentUserId,
  className,
}: GroupCardProps) {
  const isOwner = group.ownerId === currentUserId;
  const isAdmin = group.adminIds.includes(currentUserId);
  const setCount = group.sharedSetIds.length;
  const subtitle = [group.subject, group.school].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card interactive className={cn("flex h-full flex-col p-5", className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            {group.isClass ? (
              <GraduationCap className="size-5" aria-hidden />
            ) : (
              <Users className="size-5" aria-hidden />
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {(isOwner || isAdmin) && (
              <Badge>{isOwner ? "Owner" : "Admin"}</Badge>
            )}
            <Badge variant="outline">
              {group.isPublic ? <Globe aria-hidden /> : <Lock aria-hidden />}
              {group.isPublic ? "Public" : "Private"}
            </Badge>
          </div>
        </div>

        <h3 className="mt-4 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
          {group.name}
        </h3>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
            {subtitle}
          </p>
        )}
        {group.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {group.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" aria-hidden />
            {memberCountLabel(group)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-4" aria-hidden />
            {setCount} set{setCount === 1 ? "" : "s"}
          </span>
        </div>
      </Card>
    </Link>
  );
});

/** Loading placeholder matching GroupCard. */
export function GroupCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-5", className)} aria-hidden>
      <div className="flex items-start justify-between">
        <Skeleton className="size-10 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-5 w-2/3" />
      <Skeleton className="mt-2 h-4 w-full" />
      <div className="mt-5 flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-14" />
      </div>
    </Card>
  );
}
