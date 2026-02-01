"use client";

import { Users, BookOpen, Calendar, Lock, Globe } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import type { StudyGroup } from "@/types/study-group";

interface GroupCardProps {
  group: StudyGroup;
  currentUserId: string;
  className?: string;
}

/**
 * Card display for a study group
 */
export function GroupCard({ group, currentUserId, className }: GroupCardProps) {
  const isOwner = group.ownerId === currentUserId;
  const isAdmin = group.adminIds.includes(currentUserId);
  const memberCount =
    1 + group.adminIds.length + group.memberIds.length; // owner + admins + members

  return (
    <Link href={`/groups/${group.id}`}>
      <div
        className={cn(
          "p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer",
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{group.name}</h3>
              {group.isPublic ? (
                <Globe size={14} className="text-muted-foreground flex-shrink-0" />
              ) : (
                <Lock size={14} className="text-muted-foreground flex-shrink-0" />
              )}
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {group.description}
              </p>
            )}
          </div>
          {(isOwner || isAdmin) && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0 ml-2">
              {isOwner ? "Owner" : "Admin"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen size={14} />
            <span>{group.sharedSetIds.length} set{group.sharedSetIds.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{new Date(group.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface GroupCardSkeletonProps {
  className?: string;
}

/**
 * Loading skeleton for GroupCard
 */
export function GroupCardSkeleton({ className }: GroupCardSkeletonProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-card animate-pulse",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded mt-2" />
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-16 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    </div>
  );
}
