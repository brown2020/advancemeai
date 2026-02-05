"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  Link2,
  LogOut,
  Trash2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  GroupMembers,
  GroupActivity,
  GroupActivitySkeleton,
  InviteLinkModal,
} from "@/components/groups";
import * as studyGroupService from "@/services/studyGroupService";
import type { StudyGroup, GroupActivity as GroupActivityType } from "@/types/study-group";
import { canManageGroup } from "@/types/study-group";
import { cn } from "@/utils/cn";

export default function GroupDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [activities, setActivities] = useState<GroupActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const loadGroup = useCallback(async () => {
    try {
      const groupData = await studyGroupService.getStudyGroup(groupId);
      setGroup(groupData);
    } catch (error) {
      console.error("Failed to load group:", error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadActivities = useCallback(async () => {
    try {
      const activityData = await studyGroupService.getGroupActivity(groupId);
      setActivities(activityData);
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setActivitiesLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/auth/signin?redirect=/groups/${groupId}`);
      return;
    }

    void loadGroup();
    void loadActivities();
  }, [user, authLoading, groupId, router, loadGroup, loadActivities]);

  const handleLeaveGroup = async () => {
    if (!user || !group) return;

    const confirmed = window.confirm(
      "Are you sure you want to leave this group?"
    );
    if (!confirmed) return;

    setIsLeaving(true);
    try {
      await studyGroupService.leaveStudyGroup(groupId, user.uid);
      router.push("/groups");
    } catch (error) {
      console.error("Failed to leave group:", error);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!user || !group) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this group? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await studyGroupService.deleteStudyGroup(groupId, user.uid);
      router.push("/groups");
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  const handleRegenerateCode = async () => {
    if (!user) throw new Error("Not authenticated");
    const newCode = await studyGroupService.regenerateInviteCode(groupId, user.uid);
    if (group) {
      setGroup({ ...group, inviteCode: newCode });
    }
    return newCode;
  };

  const handlePromoteMember = async (targetUserId: string) => {
    if (!user) return;
    await studyGroupService.promoteMemberToAdmin(groupId, targetUserId, user.uid);
    await loadGroup();
  };

  const handleDemoteAdmin = async (targetUserId: string) => {
    if (!user) return;
    await studyGroupService.demoteAdminToMember(groupId, targetUserId, user.uid);
    await loadGroup();
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!user) return;
    const confirmed = window.confirm(
      "Are you sure you want to remove this member from the group?"
    );
    if (!confirmed) return;

    await studyGroupService.removeMemberFromGroup(groupId, targetUserId, user.uid);
    await loadGroup();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Group not found</h2>
        <p className="text-muted-foreground mb-4">
          This group may have been deleted or you don&apos;t have access.
        </p>
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Groups
        </Link>
      </div>
    );
  }

  const canManage = canManageGroup(group, user?.uid ?? "");
  const isOwner = group.ownerId === user?.uid;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={16} />
          Back to Groups
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            {group.description && (
              <p className="text-muted-foreground mt-1">{group.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="p-2 rounded-lg border hover:bg-muted transition-colors"
              title="Invite members"
            >
              <Link2 size={18} />
            </button>
            {canManage && (
              <Link
                href={`/groups/${groupId}/settings`}
                className="p-2 rounded-lg border hover:bg-muted transition-colors"
                title="Group settings"
              >
                <Settings size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column - Activity */}
        <div className="md:col-span-2 space-y-6">
          {/* Shared sets */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Shared Flashcard Sets</h3>
              {canManage && (
                <Link
                  href="/flashcards"
                  className="text-sm text-primary hover:underline"
                >
                  + Share a Set
                </Link>
              )}
            </div>

            {group.sharedSetIds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No flashcard sets shared yet</p>
                {canManage && (
                  <p className="text-xs mt-1">
                    Share your flashcard sets with the group
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {group.sharedSetIds.map((setId) => (
                  <Link
                    key={setId}
                    href={`/flashcards/${setId}`}
                    className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-muted-foreground" />
                      <span className="text-sm">Flashcard Set</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div className="p-4 rounded-lg border bg-card">
            {activitiesLoading ? (
              <GroupActivitySkeleton />
            ) : (
              <GroupActivity activities={activities} />
            )}
          </div>
        </div>

        {/* Right column - Members */}
        <div className="space-y-6">
          <div className="p-4 rounded-lg border bg-card">
            <GroupMembers
              group={group}
              currentUserId={user?.uid ?? ""}
              onPromoteMember={canManage ? handlePromoteMember : undefined}
              onDemoteAdmin={canManage ? handleDemoteAdmin : undefined}
              onRemoveMember={canManage ? handleRemoveMember : undefined}
            />
          </div>

          {/* Actions */}
          <div className="p-4 rounded-lg border bg-card space-y-2">
            {!isOwner && (
              <button
                onClick={handleLeaveGroup}
                disabled={isLeaving}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors",
                  isLeaving && "opacity-50 cursor-not-allowed"
                )}
              >
                <LogOut size={16} />
                {isLeaving ? "Leaving..." : "Leave Group"}
              </button>
            )}

            {isOwner && (
              <button
                onClick={handleDeleteGroup}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={16} />
                Delete Group
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invite modal */}
      <InviteLinkModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteCode={group.inviteCode}
        groupName={group.name}
        onRegenerateCode={canManage ? handleRegenerateCode : undefined}
      />
    </div>
  );
}
