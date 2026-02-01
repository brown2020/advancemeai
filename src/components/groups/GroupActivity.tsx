"use client";

import { BookOpen, UserPlus, UserMinus, Trophy, Share2 } from "lucide-react";
import { cn } from "@/utils/cn";
import type { GroupActivity as GroupActivityType, ActivityType } from "@/types/study-group";

interface GroupActivityProps {
  activities: GroupActivityType[];
  memberNames?: Record<string, string>;
  className?: string;
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "study_session":
      return <BookOpen size={14} className="text-blue-500" />;
    case "share_set":
      return <Share2 size={14} className="text-green-500" />;
    case "join_group":
      return <UserPlus size={14} className="text-purple-500" />;
    case "leave_group":
      return <UserMinus size={14} className="text-orange-500" />;
    case "achievement":
      return <Trophy size={14} className="text-yellow-500" />;
    default:
      return <BookOpen size={14} className="text-muted-foreground" />;
  }
}

function getActivityMessage(
  type: ActivityType,
  userName: string,
  metadata: Record<string, unknown>
): string {
  switch (type) {
    case "study_session":
      return `${userName} completed a study session`;
    case "share_set":
      return `${userName} shared a flashcard set`;
    case "join_group":
      return `${userName} joined the group`;
    case "leave_group":
      return `${userName} left the group`;
    case "achievement":
      return `${userName} unlocked an achievement`;
    default:
      return `${userName} performed an action`;
  }
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

/**
 * Displays group activity feed
 */
export function GroupActivity({
  activities,
  memberNames = {},
  className,
}: GroupActivityProps) {
  if (activities.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity yet</p>
        <p className="text-xs mt-1">Activity will appear here when members study</p>
      </div>
    );
  }

  const getName = (userId: string) =>
    memberNames[userId] || `User ${userId.slice(0, 6)}`;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-muted-foreground">
        Recent Activity
      </h3>
      <div className="space-y-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/50"
          >
            <div className="mt-0.5">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                {getActivityMessage(
                  activity.type,
                  getName(activity.userId),
                  activity.metadata
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatRelativeTime(activity.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface GroupActivitySkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Loading skeleton for GroupActivity
 */
export function GroupActivitySkeleton({
  count = 5,
  className,
}: GroupActivitySkeletonProps) {
  return (
    <div className={cn("space-y-3 animate-pulse", className)}>
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-2 px-3">
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-16 bg-muted rounded mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
