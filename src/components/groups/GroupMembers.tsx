"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Crown,
  MoreHorizontal,
  Shield,
  User,
  UserMinus,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { StudyGroup, MemberRole } from "@/types/study-group";
import { canManageGroup } from "@/types/study-group";

interface GroupMembersProps {
  group: StudyGroup;
  currentUserId: string;
  memberNames?: Record<string, string>;
  onPromoteMember?: (userId: string) => Promise<void>;
  onDemoteAdmin?: (userId: string) => Promise<void>;
  onRemoveMember?: (userId: string) => Promise<void>;
  className?: string;
}

const ROLE_META: Record<MemberRole, { label: string; icon: React.ReactNode }> = {
  owner: { label: "Owner", icon: <Crown className="size-3.5 text-streak" aria-hidden /> },
  admin: { label: "Admin", icon: <Shield className="size-3.5 text-primary" aria-hidden /> },
  member: { label: "Member", icon: <User className="size-3.5" aria-hidden /> },
};

const menuItemClass =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:opacity-50 focus-visible:outline-none focus-visible:bg-secondary";

interface MemberRowProps {
  name: string;
  role: MemberRole;
  canManage: boolean;
  isCurrentUser: boolean;
  onPromote?: () => Promise<void>;
  onDemote?: () => Promise<void>;
  onRemove?: () => Promise<void>;
}

function MemberRow({
  name,
  role,
  canManage,
  isCurrentUser,
  onPromote,
  onDemote,
  onRemove,
}: MemberRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const runAction = async (action: (() => Promise<void>) | undefined) => {
    if (!action) return;
    setIsBusy(true);
    try {
      await action();
    } finally {
      setIsBusy(false);
      setMenuOpen(false);
    }
  };

  const showMenu = canManage && !isCurrentUser && role !== "owner";

  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-primary"
        aria-hidden
      >
        {name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {name}
          {isCurrentUser && <span className="ml-1 font-normal text-muted-foreground">(you)</span>}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {ROLE_META[role].icon}
          {ROLE_META[role].label}
        </p>
      </div>

      {showMenu && (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isBusy}
              aria-label={`Manage ${name}`}
            >
              <MoreHorizontal aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1">
            {role === "member" && onPromote && (
              <button
                type="button"
                className={menuItemClass}
                disabled={isBusy}
                onClick={() => runAction(onPromote)}
              >
                <ChevronUp className="size-4" aria-hidden />
                Make admin
              </button>
            )}
            {role === "admin" && onDemote && (
              <button
                type="button"
                className={menuItemClass}
                disabled={isBusy}
                onClick={() => runAction(onDemote)}
              >
                <ChevronDown className="size-4" aria-hidden />
                Remove admin role
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                className={cn(menuItemClass, "text-destructive hover:bg-destructive/10")}
                disabled={isBusy}
                onClick={() => runAction(onRemove)}
              >
                <UserMinus className="size-4" aria-hidden />
                Remove member
              </button>
            )}
          </PopoverContent>
        </Popover>
      )}
    </li>
  );
}

const EMPTY_MEMBER_NAMES: Record<string, string> = {};

/** Member roster with owner/admin management actions. */
export function GroupMembers({
  group,
  currentUserId,
  memberNames = EMPTY_MEMBER_NAMES,
  onPromoteMember,
  onDemoteAdmin,
  onRemoveMember,
  className,
}: GroupMembersProps) {
  const canManage = canManageGroup(group, currentUserId);

  const members: { userId: string; role: MemberRole }[] = [
    { userId: group.ownerId, role: "owner" },
    ...group.adminIds.map((id) => ({ userId: id, role: "admin" as const })),
    ...group.memberIds.map((id) => ({ userId: id, role: "member" as const })),
  ];

  const getName = (userId: string) => memberNames[userId] || `User ${userId.slice(0, 6)}`;

  return (
    <ul className={cn("divide-y divide-border", className)}>
      {members.map(({ userId, role }) => (
        <MemberRow
          key={`${role}-${userId}`}
          name={getName(userId)}
          role={role}
          canManage={canManage}
          isCurrentUser={userId === currentUserId}
          onPromote={onPromoteMember ? () => onPromoteMember(userId) : undefined}
          onDemote={onDemoteAdmin ? () => onDemoteAdmin(userId) : undefined}
          onRemove={onRemoveMember ? () => onRemoveMember(userId) : undefined}
        />
      ))}
    </ul>
  );
}
