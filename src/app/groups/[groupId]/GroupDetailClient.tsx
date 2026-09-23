"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams, redirect } from "next/navigation";
import { LogOut, Trash2, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  ClassProgressDashboard,
  ClassProgressSkeleton,
  ConfirmDialog,
  GroupActivity,
  GroupActivitySkeleton,
  GroupDetailHeader,
  GroupMembers,
  GroupSharedSets,
  InviteLinkModal,
  groupNoun,
} from "@/components/groups";
import {
  EmptyState,
  ErrorDisplay,
  PageContainer,
} from "@/components/common/UIComponents";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import * as studyGroupService from "@/services/studyGroupService";
import { fetchClassProgressForGroup } from "@/services/classProgressService";
import type { ClassProgressDashboardData } from "@/types/class-progress";
import type { StudyGroup, GroupActivity as GroupActivityType } from "@/types/study-group";
import { canManageGroup } from "@/types/study-group";
import { logger } from "@/utils/logger";

type DetailTab = "sets" | "members" | "activity" | "progress";

type PendingAction =
  | { kind: "leave" }
  | { kind: "delete" }
  | { kind: "remove"; userId: string }
  | null;

export default function GroupDetailClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<GroupActivityType[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [classProgress, setClassProgress] = useState<ClassProgressDashboardData | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  const [tab, setTab] = useState<DetailTab>("sets");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadGroup = useCallback(async () => {
    try {
      const groupData = await studyGroupService.getStudyGroup(groupId);
      setGroup(groupData);
    } catch (error) {
      logger.error("Failed to load group:", error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadActivities = useCallback(async () => {
    try {
      const activityData = await studyGroupService.getGroupActivity(groupId);
      setActivities(activityData);
    } catch (error) {
      logger.error("Failed to load activities:", error);
    } finally {
      setActivitiesLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (authLoading || !user) return;
    void loadGroup();
    void loadActivities();
  }, [user, authLoading, groupId, loadGroup, loadActivities]);

  useEffect(() => {
    if (!user || !group || !canManageGroup(group, user.uid)) {
      setClassProgress(null);
      setProgressError(null);
      return;
    }

    let cancelled = false;
    setProgressLoading(true);
    setProgressError(null);

    fetchClassProgressForGroup(groupId)
      .then((data) => {
        if (!cancelled) setClassProgress(data);
      })
      .catch((err) => {
        logger.error("Failed to load class progress:", err);
        if (!cancelled) setProgressError("Could not load class progress. Try again later.");
      })
      .finally(() => {
        if (!cancelled) setProgressLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, group, groupId]);

  const handleRegenerateCode = async () => {
    if (!user) throw new Error("Not authenticated");
    const newCode = await studyGroupService.regenerateInviteCode(groupId, user.uid);
    if (group) setGroup({ ...group, inviteCode: newCode });
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
    setPendingAction({ kind: "remove", userId: targetUserId });
  };

  const runPendingAction = async () => {
    if (!user || !group || !pendingAction) return;
    setIsActing(true);
    setActionError(null);
    try {
      if (pendingAction.kind === "leave") {
        await studyGroupService.leaveStudyGroup(groupId, user.uid);
        router.push("/groups");
      } else if (pendingAction.kind === "delete") {
        await studyGroupService.deleteStudyGroup(groupId, user.uid);
        router.push("/groups");
      } else {
        await studyGroupService.removeMemberFromGroup(groupId, pendingAction.userId, user.uid);
        await loadGroup();
      }
      setPendingAction(null);
    } catch (error) {
      logger.error(`Group action "${pendingAction.kind}" failed:`, error);
      setActionError("That didn't work. Please try again.");
      setPendingAction(null);
    } finally {
      setIsActing(false);
    }
  };

  if (!authLoading && !user) {
    redirect(`/auth/signin?returnTo=/groups/${groupId}`);
  }

  if (authLoading || loading) {
    return <GroupDetailSkeleton />;
  }

  if (!group) {
    return (
      <PageContainer width="narrow">
        <EmptyState
          icon={<Users />}
          title="Class not found"
          message="It may have been deleted, or you don't have access."
          actionLink="/groups"
          actionText="Back to Classes"
        />
      </PageContainer>
    );
  }

  const currentUserId = user?.uid ?? "";
  const canManage = canManageGroup(group, currentUserId);
  const isOwner = group.ownerId === currentUserId;
  const role = isOwner ? "owner" : canManage ? "admin" : "member";
  const noun = groupNoun(group);
  const activeTab: DetailTab = tab === "progress" && !canManage ? "sets" : tab;

  const tabOptions: { value: DetailTab; label: string }[] = [
    { value: "sets", label: "Sets" },
    { value: "members", label: "Members" },
    { value: "activity", label: "Activity" },
    ...(canManage ? [{ value: "progress" as const, label: "Progress" }] : []),
  ];

  const confirmCopy = {
    leave: {
      title: `Leave this ${noun}?`,
      description: "You'll lose access to its shared sets until you're invited again.",
      confirmLabel: `Leave ${noun}`,
    },
    delete: {
      title: `Delete this ${noun}?`,
      description: "This removes it for every member and cannot be undone.",
      confirmLabel: `Delete ${noun}`,
    },
    remove: {
      title: "Remove this member?",
      description: `They'll lose access to the ${noun} until they join again.`,
      confirmLabel: "Remove member",
    },
  } as const;
  const confirm = pendingAction ? confirmCopy[pendingAction.kind] : null;

  return (
    <PageContainer>
      <GroupDetailHeader group={group} role={role} onInvite={() => setShowInviteModal(true)} />

      {actionError && <ErrorDisplay message={actionError} />}

      <Segmented<DetailTab>
        label={`${noun} sections`}
        value={activeTab}
        onChange={setTab}
        options={tabOptions}
        className="mb-6"
      />

      <div role="tabpanel" aria-label={tabOptions.find((t) => t.value === activeTab)?.label}>
        {activeTab === "sets" && (
          <GroupSharedSets setIds={group.sharedSetIds} canManage={canManage} noun={noun} />
        )}

        {activeTab === "members" && (
          <Card className="px-5 py-2">
            <GroupMembers
              group={group}
              currentUserId={currentUserId}
              onPromoteMember={canManage ? handlePromoteMember : undefined}
              onDemoteAdmin={canManage ? handleDemoteAdmin : undefined}
              onRemoveMember={canManage ? handleRemoveMember : undefined}
            />
          </Card>
        )}

        {activeTab === "activity" &&
          (activitiesLoading ? (
            <Card className="p-5">
              <GroupActivitySkeleton />
            </Card>
          ) : activities.length === 0 ? (
            <GroupActivity activities={activities} />
          ) : (
            <Card className="px-5 py-2">
              <GroupActivity activities={activities} />
            </Card>
          ))}

        {activeTab === "progress" && canManage && (
          <section aria-labelledby="class-progress-heading">
            {progressLoading ? (
              <ClassProgressSkeleton />
            ) : progressError ? (
              <ErrorDisplay message={progressError} />
            ) : classProgress ? (
              <ClassProgressDashboard data={classProgress} />
            ) : (
              <EmptyState
                title="No progress data yet"
                message="Progress appears once students start studying shared sets."
              />
            )}
          </section>
        )}
      </div>

      <div className="mt-12 flex justify-center border-t border-border pt-6">
        {isOwner ? (
          <Button
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setPendingAction({ kind: "delete" })}
          >
            <Trash2 aria-hidden />
            Delete {noun}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setPendingAction({ kind: "leave" })}
          >
            <LogOut aria-hidden />
            Leave {noun}
          </Button>
        )}
      </div>

      <InviteLinkModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteCode={group.inviteCode}
        groupName={group.name}
        noun={noun}
        onRegenerateCode={canManage ? handleRegenerateCode : undefined}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onCancel={() => setPendingAction(null)}
        onConfirm={runPendingAction}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.confirmLabel ?? "Confirm"}
        isLoading={isActing}
      />
    </PageContainer>
  );
}

function GroupDetailSkeleton() {
  return (
    <PageContainer>
      <div aria-busy="true" aria-label="Loading class">
        <Skeleton className="mb-4 h-4 w-20" />
        <div className="flex items-start gap-4">
          <Skeleton className="hidden size-14 rounded-2xl sm:block" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="mt-8 h-9 w-72 rounded-full" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    </PageContainer>
  );
}
