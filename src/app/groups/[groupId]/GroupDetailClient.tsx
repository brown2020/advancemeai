"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams, redirect } from "next/navigation";
import { LogOut, Trash2, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ClassProgressDashboard, ClassProgressSkeleton } from "@/components/groups/ClassProgressDashboard";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { GroupActivity, GroupActivitySkeleton } from "@/components/groups/GroupActivity";
import { GroupDetailHeader } from "@/components/groups/GroupDetailHeader";
import { GroupMembers } from "@/components/groups/GroupMembers";
import { GroupSharedSets } from "@/components/groups/GroupSharedSets";
import { InviteLinkModal } from "@/components/groups/InviteLinkModal";
import { groupNoun } from "@/components/groups/group-labels";
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
import { signInHref } from "@/constants/appConstants";

type DetailTab = "sets" | "members" | "activity" | "progress";
type MemberRole = "owner" | "admin" | "member";

type PendingAction =
  | { kind: "leave" }
  | { kind: "delete" }
  | { kind: "remove"; userId: string }
  | null;

type ConfirmCopy = {
  title: string;
  description: string;
  confirmLabel: string;
};

function memberRole(isOwner: boolean, canManage: boolean): MemberRole {
  if (isOwner) return "owner";
  if (canManage) return "admin";
  return "member";
}

function visibleDetailTab(tab: DetailTab, canManage: boolean): DetailTab {
  if (tab === "progress" && !canManage) return "sets";
  return tab;
}

function detailTabOptions(canManage: boolean): { value: DetailTab; label: string }[] {
  const options: { value: DetailTab; label: string }[] = [
    { value: "sets", label: "Sets" },
    { value: "members", label: "Members" },
    { value: "activity", label: "Activity" },
  ];
  if (canManage) options.push({ value: "progress", label: "Progress" });
  return options;
}

function tabLabel(
  options: { value: DetailTab; label: string }[],
  activeTab: DetailTab,
): string | undefined {
  return options.find((option) => option.value === activeTab)?.label;
}

function confirmCopyFor(noun: string, kind: "leave" | "delete" | "remove"): ConfirmCopy {
  if (kind === "leave") {
    return {
      title: `Leave this ${noun}?`,
      description: "You'll lose access to its shared sets until you're invited again.",
      confirmLabel: `Leave ${noun}`,
    };
  }
  if (kind === "delete") {
    return {
      title: `Delete this ${noun}?`,
      description: "This removes it for every member and cannot be undone.",
      confirmLabel: `Delete ${noun}`,
    };
  }
  return {
    title: "Remove this member?",
    description: `They'll lose access to the ${noun} until they join again.`,
    confirmLabel: "Remove member",
  };
}

function pendingConfirm(noun: string, pendingAction: PendingAction): ConfirmCopy | null {
  if (!pendingAction) return null;
  return confirmCopyFor(noun, pendingAction.kind);
}

function currentUserIdOf(user: { uid: string } | null): string {
  return user?.uid ?? "";
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

function MissingGroup() {
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

function MembersPanel({
  group,
  currentUserId,
  canManage,
  onPromoteMember,
  onDemoteAdmin,
  onRemoveMember,
}: {
  group: StudyGroup;
  currentUserId: string;
  canManage: boolean;
  onPromoteMember: (userId: string) => Promise<void>;
  onDemoteAdmin: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => void;
}) {
  return (
    <Card className="px-5 py-2">
      <GroupMembers
        group={group}
        currentUserId={currentUserId}
        onPromoteMember={canManage ? onPromoteMember : undefined}
        onDemoteAdmin={canManage ? onDemoteAdmin : undefined}
        onRemoveMember={
          canManage ? async (userId) => {
            await onRemoveMember(userId);
          } : undefined
        }
      />
    </Card>
  );
}

function ActivityPanel({
  activitiesLoading,
  activities,
}: {
  activitiesLoading: boolean;
  activities: GroupActivityType[];
}) {
  if (activitiesLoading) {
    return (
      <Card className="p-5">
        <GroupActivitySkeleton />
      </Card>
    );
  }
  if (activities.length === 0) return <GroupActivity activities={activities} />;
  return (
    <Card className="px-5 py-2">
      <GroupActivity activities={activities} />
    </Card>
  );
}

function ProgressPanel({
  progressLoading,
  progressError,
  classProgress,
}: {
  progressLoading: boolean;
  progressError: string | null;
  classProgress: ClassProgressDashboardData | null;
}) {
  if (progressLoading) return <ClassProgressSkeleton />;
  if (progressError) return <ErrorDisplay message={progressError} />;
  if (classProgress) return <ClassProgressDashboard data={classProgress} />;
  return (
    <EmptyState
      title="No progress data yet"
      message="Progress appears once students start studying shared sets."
    />
  );
}

function GroupTabPanels({
  activeTab,
  group,
  noun,
  canManage,
  currentUserId,
  activitiesLoading,
  activities,
  progressLoading,
  progressError,
  classProgress,
  onPromoteMember,
  onDemoteAdmin,
  onRemoveMember,
}: {
  activeTab: DetailTab;
  group: StudyGroup;
  noun: string;
  canManage: boolean;
  currentUserId: string;
  activitiesLoading: boolean;
  activities: GroupActivityType[];
  progressLoading: boolean;
  progressError: string | null;
  classProgress: ClassProgressDashboardData | null;
  onPromoteMember: (userId: string) => Promise<void>;
  onDemoteAdmin: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => void;
}) {
  if (activeTab === "sets") {
    return <GroupSharedSets setIds={group.sharedSetIds} canManage={canManage} noun={noun} />;
  }
  if (activeTab === "members") {
    return (
      <MembersPanel
        group={group}
        currentUserId={currentUserId}
        canManage={canManage}
        onPromoteMember={onPromoteMember}
        onDemoteAdmin={onDemoteAdmin}
        onRemoveMember={onRemoveMember}
      />
    );
  }
  if (activeTab === "activity") {
    return <ActivityPanel activitiesLoading={activitiesLoading} activities={activities} />;
  }
  if (activeTab === "progress") {
    return (
      <ProgressPanel
        progressLoading={progressLoading}
        progressError={progressError}
        classProgress={classProgress}
      />
    );
  }
  return null;
}

function GroupDangerZone({
  isOwner,
  noun,
  onDelete,
  onLeave,
}: {
  isOwner: boolean;
  noun: string;
  onDelete: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="mt-12 flex justify-center border-t border-border pt-6">
      {isOwner ? (
        <Button
          variant="ghost"
          className="text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 aria-hidden />
          Delete {noun}
        </Button>
      ) : (
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          onClick={onLeave}
        >
          <LogOut aria-hidden />
          Leave {noun}
        </Button>
      )}
    </div>
  );
}

function GroupConfirm({
  confirm,
  isActing,
  onCancel,
  onConfirm,
}: {
  confirm: ConfirmCopy | null;
  isActing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={confirm !== null}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={confirm?.title ?? ""}
      description={confirm?.description ?? ""}
      confirmLabel={confirm?.confirmLabel ?? "Confirm"}
      isLoading={isActing}
    />
  );
}

function GroupDetailView({
  group,
  role,
  noun,
  canManage,
  isOwner,
  currentUserId,
  activeTab,
  actionError,
  activities,
  activitiesLoading,
  classProgress,
  progressLoading,
  progressError,
  confirm,
  isActing,
  showInviteModal,
  onTabChange,
  onInvite,
  onPromoteMember,
  onDemoteAdmin,
  onRemoveMember,
  onDelete,
  onLeave,
  onCloseInvite,
  onRegenerateCode,
  onCancelConfirm,
  onConfirm,
}: {
  group: StudyGroup;
  role: MemberRole;
  noun: string;
  canManage: boolean;
  isOwner: boolean;
  currentUserId: string;
  activeTab: DetailTab;
  actionError: string | null;
  activities: GroupActivityType[];
  activitiesLoading: boolean;
  classProgress: ClassProgressDashboardData | null;
  progressLoading: boolean;
  progressError: string | null;
  confirm: ConfirmCopy | null;
  isActing: boolean;
  showInviteModal: boolean;
  onTabChange: (tab: DetailTab) => void;
  onInvite: () => void;
  onPromoteMember: (userId: string) => Promise<void>;
  onDemoteAdmin: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => void;
  onDelete: () => void;
  onLeave: () => void;
  onCloseInvite: () => void;
  onRegenerateCode: (() => Promise<string>) | undefined;
  onCancelConfirm: () => void;
  onConfirm: () => void;
}) {
  const tabOptions = detailTabOptions(canManage);
  return (
    <PageContainer>
      <GroupDetailHeader group={group} role={role} onInvite={onInvite} />

      {actionError ? <ErrorDisplay message={actionError} /> : null}

      <Segmented<DetailTab>
        label={`${noun} sections`}
        value={activeTab}
        onChange={onTabChange}
        options={tabOptions}
        className="mb-6"
      />

      <div role="tabpanel" aria-label={tabLabel(tabOptions, activeTab)}>
        <GroupTabPanels
          activeTab={activeTab}
          group={group}
          noun={noun}
          canManage={canManage}
          currentUserId={currentUserId}
          activitiesLoading={activitiesLoading}
          activities={activities}
          progressLoading={progressLoading}
          progressError={progressError}
          classProgress={classProgress}
          onPromoteMember={onPromoteMember}
          onDemoteAdmin={onDemoteAdmin}
          onRemoveMember={onRemoveMember}
        />
      </div>

      <GroupDangerZone isOwner={isOwner} noun={noun} onDelete={onDelete} onLeave={onLeave} />

      <InviteLinkModal
        isOpen={showInviteModal}
        onClose={onCloseInvite}
        inviteCode={group.inviteCode}
        groupName={group.name}
        noun={noun}
        onRegenerateCode={onRegenerateCode}
      />

      <GroupConfirm
        confirm={confirm}
        isActing={isActing}
        onCancel={onCancelConfirm}
        onConfirm={onConfirm}
      />
    </PageContainer>
  );
}

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
        if (cancelled) return;
        setClassProgress(data);
      })
      .catch((err) => {
        logger.error("Failed to load class progress:", err);
        if (cancelled) return;
        setProgressError("Could not load class progress. Try again later.");
      })
      .finally(() => {
        if (cancelled) return;
        setProgressLoading(false);
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
    redirect(signInHref(`/groups/${groupId}`));
  }

  if (authLoading || loading) {
    return <GroupDetailSkeleton />;
  }

  if (!group) return <MissingGroup />;

  const currentUserId = currentUserIdOf(user);
  const canManage = canManageGroup(group, currentUserId);
  const isOwner = group.ownerId === currentUserId;
  const noun = groupNoun(group);

  return (
    <GroupDetailView
      group={group}
      role={memberRole(isOwner, canManage)}
      noun={noun}
      canManage={canManage}
      isOwner={isOwner}
      currentUserId={currentUserId}
      activeTab={visibleDetailTab(tab, canManage)}
      actionError={actionError}
      activities={activities}
      activitiesLoading={activitiesLoading}
      classProgress={classProgress}
      progressLoading={progressLoading}
      progressError={progressError}
      confirm={pendingConfirm(noun, pendingAction)}
      isActing={isActing}
      onTabChange={setTab}
      onInvite={() => setShowInviteModal(true)}
      onPromoteMember={handlePromoteMember}
      onDemoteAdmin={handleDemoteAdmin}
      onRemoveMember={handleRemoveMember}
      onDelete={() => setPendingAction({ kind: "delete" })}
      onLeave={() => setPendingAction({ kind: "leave" })}
      onCloseInvite={() => setShowInviteModal(false)}
      onRegenerateCode={canManage ? handleRegenerateCode : undefined}
      onCancelConfirm={() => setPendingAction(null)}
      onConfirm={() => void runPendingAction()}
      showInviteModal={showInviteModal}
    />
  );
}
