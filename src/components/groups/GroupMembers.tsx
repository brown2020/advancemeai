"use client";

import { useState } from "react";
import { Crown, Shield, User, MoreVertical, UserMinus, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";
import type { StudyGroup, MemberRole } from "@/types/study-group";
import { getUserRole, canManageGroup } from "@/types/study-group";

interface GroupMembersProps {
  group: StudyGroup;
  currentUserId: string;
  memberNames?: Record<string, string>;
  onPromoteMember?: (userId: string) => Promise<void>;
  onDemoteAdmin?: (userId: string) => Promise<void>;
  onRemoveMember?: (userId: string) => Promise<void>;
  className?: string;
}

interface MemberItemProps {
  userId: string;
  name: string;
  role: MemberRole;
  currentUserCanManage: boolean;
  isCurrentUser: boolean;
  onPromote?: () => Promise<void>;
  onDemote?: () => Promise<void>;
  onRemove?: () => Promise<void>;
}

function MemberItem({
  userId,
  name,
  role,
  currentUserCanManage,
  isCurrentUser,
  onPromote,
  onDemote,
  onRemove,
}: MemberItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: (() => Promise<void>) | undefined) => {
    if (!action) return;
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const roleIcon = {
    owner: <Crown size={14} className="text-yellow-500" />,
    admin: <Shield size={14} className="text-blue-500" />,
    member: <User size={14} className="text-muted-foreground" />,
  };

  const roleLabel = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">
            {name}
            {isCurrentUser && (
              <span className="text-muted-foreground ml-1">(you)</span>
            )}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {roleIcon[role]}
            <span>{roleLabel[role]}</span>
          </div>
        </div>
      </div>

      {currentUserCanManage && !isCurrentUser && role !== "owner" && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-muted"
            disabled={isLoading}
          >
            <MoreVertical size={16} className="text-muted-foreground" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg border bg-popover shadow-lg py-1">
                {role === "member" && onPromote && (
                  <button
                    onClick={() => handleAction(onPromote)}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <ChevronUp size={14} />
                    Promote to Admin
                  </button>
                )}
                {role === "admin" && onDemote && (
                  <button
                    onClick={() => handleAction(onDemote)}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <ChevronDown size={14} />
                    Demote to Member
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={() => handleAction(onRemove)}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive"
                    disabled={isLoading}
                  >
                    <UserMinus size={14} />
                    Remove from Group
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Displays and manages group members
 */
export function GroupMembers({
  group,
  currentUserId,
  memberNames = {},
  onPromoteMember,
  onDemoteAdmin,
  onRemoveMember,
  className,
}: GroupMembersProps) {
  const currentUserRole = getUserRole(group, currentUserId);
  const currentUserCanManage = canManageGroup(group, currentUserId);

  // Build member list with roles
  const allMembers: { userId: string; role: MemberRole }[] = [
    { userId: group.ownerId, role: "owner" },
    ...group.adminIds.map((id) => ({ userId: id, role: "admin" as MemberRole })),
    ...group.memberIds.map((id) => ({ userId: id, role: "member" as MemberRole })),
  ];

  const getName = (userId: string) =>
    memberNames[userId] || `User ${userId.slice(0, 6)}`;

  return (
    <div className={cn("space-y-1", className)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        Members ({allMembers.length})
      </h3>
      <div className="space-y-1">
        {allMembers.map(({ userId, role }) => (
          <MemberItem
            key={userId}
            userId={userId}
            name={getName(userId)}
            role={role}
            currentUserCanManage={currentUserCanManage}
            isCurrentUser={userId === currentUserId}
            onPromote={
              onPromoteMember ? () => onPromoteMember(userId) : undefined
            }
            onDemote={
              onDemoteAdmin ? () => onDemoteAdmin(userId) : undefined
            }
            onRemove={
              onRemoveMember ? () => onRemoveMember(userId) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
