import { Activity, BookOpen, Share2, Trophy, UserMinus, UserPlus } from "lucide-react";
import { cn } from "@/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/UIComponents";
import type { GroupActivity as GroupActivityType, ActivityType } from "@/types/study-group";

interface GroupActivityProps {
  activities: GroupActivityType[];
  memberNames?: Record<string, string>;
  className?: string;
}

const ACTIVITY_META: Record<
  ActivityType,
  { icon: React.ReactNode; tone: string; verb: string }
> = {
  study_session: {
    icon: <BookOpen className="size-4" aria-hidden />,
    tone: "bg-accent text-primary",
    verb: "completed a study session",
  },
  share_set: {
    icon: <Share2 className="size-4" aria-hidden />,
    tone: "bg-success/10 text-success",
    verb: "shared a flashcard set",
  },
  join_group: {
    icon: <UserPlus className="size-4" aria-hidden />,
    tone: "bg-accent text-primary",
    verb: "joined",
  },
  leave_group: {
    icon: <UserMinus className="size-4" aria-hidden />,
    tone: "bg-warning/15 text-warning",
    verb: "left",
  },
  achievement: {
    icon: <Trophy className="size-4" aria-hidden />,
    tone: "bg-streak/15 text-streak",
    verb: "unlocked an achievement",
  },
  level_up: {
    icon: <Trophy className="size-4" aria-hidden />,
    tone: "bg-streak/15 text-streak",
    verb: "leveled up",
  },
};

const FALLBACK_META = {
  icon: <Activity className="size-4" aria-hidden />,
  tone: "bg-secondary text-muted-foreground",
  verb: "performed an action",
};

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

const EMPTY_MEMBER_NAMES: Record<string, string> = {};

/** Recent activity feed for a class or study group. */
export function GroupActivity({
  activities,
  memberNames = EMPTY_MEMBER_NAMES,
  className,
}: GroupActivityProps) {
  if (activities.length === 0) {
    return (
      <EmptyState
        className={className}
        icon={<Activity />}
        title="No activity yet"
        message="Study sessions, shared sets and new members will show up here."
      />
    );
  }

  const getName = (userId: string) => memberNames[userId] || `User ${userId.slice(0, 6)}`;

  return (
    <ul className={cn("divide-y divide-border", className)}>
      {activities.map((activity) => {
        const meta = ACTIVITY_META[activity.type] ?? FALLBACK_META;
        return (
          <li key={activity.id} className="flex items-center gap-3 py-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                meta.tone
              )}
            >
              {meta.icon}
            </span>
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-semibold">{getName(activity.userId)}</span>{" "}
              {meta.verb}
            </p>
            <time
              dateTime={new Date(activity.createdAt).toISOString()}
              className="shrink-0 text-xs text-muted-foreground"
            >
              {formatRelativeTime(activity.createdAt)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}

/** Loading placeholder for GroupActivity. */
export function GroupActivitySkeleton({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)} aria-busy="true" aria-label="Loading activity">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-xl" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}
