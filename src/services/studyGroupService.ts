/**
 * Study Group Service
 * Business logic for study groups
 */

import {
  createStudyGroup as createGroupRepo,
  getStudyGroup as getGroupRepo,
  getUserStudyGroups as getUserGroupsRepo,
  deleteStudyGroup as deleteGroupRepo,
  shareSetWithGroup as shareSetRepo,
  unshareSetFromGroup as unshareSetRepo,
  regenerateInviteCode as regenerateCodeRepo,
  getGroupActivity as getActivityRepo,
  promoteMemberToAdmin as promoteRepo,
  demoteAdminToMember as demoteRepo,
  removeMemberFromGroup as removeRepo,
} from "@/api/firebase/studyGroupRepository";
import type {
  StudyGroup,
  GroupActivity,
  CreateStudyGroupInput,
} from "@/types/study-group";
import { canManageGroup } from "@/types/study-group";
import { createCachedService } from "@/utils/cachedService";
import { getFlashcardSet } from "@/services/flashcardService";
import { canCopyFlashcardSet } from "@/lib/flashcard-visibility";

// Cache keys
const CACHE_KEYS = {
  group: (groupId: string) => `study-group:${groupId}`,
  userGroups: (userId: string) => `user-groups:${userId}`,
  groupActivity: (groupId: string) => `group-activity:${groupId}`,
};

// Create cached service instance
const { cachedFetch, invalidate } = createCachedService<
  StudyGroup | StudyGroup[] | GroupActivity[]
>("studyGroup");

/**
 * Create a new study group
 */
export async function createStudyGroup(
  userId: string,
  input: CreateStudyGroupInput
): Promise<StudyGroup> {
  const group = await cachedFetch({
    cacheKey: "",
    fetchData: () => createGroupRepo(userId, input),
    invalidateKeys: [CACHE_KEYS.userGroups(userId)],
    logMessage: `Creating study group: ${input.name}`,
  });

  return group as StudyGroup;
}

/**
 * Get a study group by ID
 */
export async function getStudyGroup(groupId: string): Promise<StudyGroup | null> {
  const group = await cachedFetch({
    cacheKey: CACHE_KEYS.group(groupId),
    fetchData: () => getGroupRepo(groupId),
    logMessage: `Fetching study group: ${groupId}`,
  });

  return group as StudyGroup | null;
}

export type GroupInvitePreview = {
  id: string;
  name: string;
  description?: string;
  isClass: boolean;
  isPublic: boolean;
  memberCount: number;
  alreadyMember: boolean;
};

/**
 * Look up a class by invite code without exposing the roster.
 */
export async function getStudyGroupByInviteCode(
  inviteCode: string
): Promise<GroupInvitePreview | null> {
  const response = await fetch(
    `/api/groups/lookup?code=${encodeURIComponent(inviteCode)}`,
    { credentials: "include" }
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error("Failed to look up that class");
  }
  return response.json() as Promise<GroupInvitePreview>;
}

/**
 * Get all groups for a user
 */
export async function getUserStudyGroups(userId: string): Promise<StudyGroup[]> {
  const groups = await cachedFetch({
    cacheKey: CACHE_KEYS.userGroups(userId),
    fetchData: () => getUserGroupsRepo(userId),
    logMessage: `Fetching groups for user: ${userId}`,
  });

  return groups as StudyGroup[];
}

/**
 * Delete a study group
 */
export async function deleteStudyGroup(
  groupId: string,
  userId: string
): Promise<void> {
  const group = await getStudyGroup(groupId);
  if (!group) {
    throw new Error("Study group not found");
  }

  if (group.ownerId !== userId) {
    throw new Error("Only the owner can delete this group");
  }

  await cachedFetch({
    cacheKey: "",
    fetchData: () => deleteGroupRepo(groupId),
    invalidateKeys: [
      CACHE_KEYS.group(groupId),
      CACHE_KEYS.userGroups(userId),
    ],
    logMessage: `Deleting study group: ${groupId}`,
  });
}

/**
 * Join a study group
 */
export async function joinStudyGroupByCode(
  inviteCode: string,
  userId: string
): Promise<{ id: string; alreadyMember: boolean }> {
  const response = await fetch("/api/groups/join", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: inviteCode }),
  });
  if (!response.ok) {
    throw new Error("Failed to join that class");
  }
  const result = (await response.json()) as { id: string; alreadyMember: boolean };
  invalidate([
    CACHE_KEYS.group(result.id),
    CACHE_KEYS.userGroups(userId),
    CACHE_KEYS.groupActivity(result.id),
  ]);
  return result;
}

/**
 * Leave a study group
 */
export async function leaveStudyGroup(
  groupId: string,
  userId: string
): Promise<void> {
  const group = await getStudyGroup(groupId);
  if (!group) {
    throw new Error("Study group not found");
  }

  if (group.ownerId === userId) {
    throw new Error("The owner cannot leave the group. Delete it instead.");
  }

  const response = await fetch(`/api/groups/${groupId}/leave`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to leave that class");
  }
  invalidate([
    CACHE_KEYS.group(groupId),
    CACHE_KEYS.userGroups(userId),
    CACHE_KEYS.groupActivity(groupId),
  ]);
}

/**
 * Share a flashcard set with a group
 */
export async function shareSetWithGroup(
  groupId: string,
  setId: string,
  userId: string
): Promise<void> {
  const group = await getStudyGroup(groupId);
  if (!group) {
    throw new Error("Study group not found");
  }

  if (!canManageGroup(group, userId)) {
    throw new Error("Only group owners and admins can share sets");
  }

  // Verify the user owns the set or the set can be copied/shared by link.
  try {
    const flashcardSet = await getFlashcardSet(setId);
    if (!canCopyFlashcardSet(flashcardSet, userId)) {
      throw new Error(
        "You can only share sets you own or public/unlisted sets"
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("only share")) {
      throw error;
    }
    throw new Error("Flashcard set not found");
  }

  await cachedFetch({
    cacheKey: "",
    fetchData: () => shareSetRepo(groupId, setId, userId),
    invalidateKeys: [
      CACHE_KEYS.group(groupId),
      CACHE_KEYS.groupActivity(groupId),
    ],
    logMessage: `Sharing set ${setId} with group: ${groupId}`,
  });
}

/**
 * Remove a shared set from a group
 */
export async function unshareSetFromGroup(
  groupId: string,
  setId: string,
  userId: string
): Promise<void> {
  const group = await getStudyGroup(groupId);
  if (!group) {
    throw new Error("Study group not found");
  }

  if (!canManageGroup(group, userId)) {
    throw new Error("You don't have permission to remove sets from this group");
  }

  await cachedFetch({
    cacheKey: "",
    fetchData: () => unshareSetRepo(groupId, setId),
    invalidateKeys: [CACHE_KEYS.group(groupId)],
    logMessage: `Removing set ${setId} from group: ${groupId}`,
  });
}

/**
 * Regenerate invite code
 */
export async function regenerateInviteCode(
  groupId: string,
  userId: string
): Promise<string> {
  const group = await getStudyGroup(groupId);
  if (!group) {
    throw new Error("Study group not found");
  }

  if (!canManageGroup(group, userId)) {
    throw new Error("You don't have permission to regenerate the invite code");
  }

  const newCode = await regenerateCodeRepo(groupId);
  invalidate([CACHE_KEYS.group(groupId)]);

  return newCode;
}

/**
 * Get group activity feed
 */
export async function getGroupActivity(
  groupId: string,
  limitCount = 20
): Promise<GroupActivity[]> {
  const activity = await cachedFetch({
    cacheKey: CACHE_KEYS.groupActivity(groupId),
    fetchData: () => getActivityRepo(groupId, limitCount),
    logMessage: `Fetching activity for group: ${groupId}`,
  });

  return activity as GroupActivity[];
}

/**
 * Promote a member to admin
 */
export async function promoteMemberToAdmin(
  groupId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<void> {
  const group = await getStudyGroup(groupId);
  if (!group) {
    throw new Error("Study group not found");
  }

  if (group.ownerId !== requestingUserId) {
    throw new Error("Only the owner can promote members to admin");
  }

  await promoteRepo(groupId, targetUserId);
  invalidate([CACHE_KEYS.group(groupId)]);
}

/**
 * Demote an admin to member
 */
export async function demoteAdminToMember(
  groupId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<void> {
  const group = await getStudyGroup(groupId);
  if (!group) {
    throw new Error("Study group not found");
  }

  if (group.ownerId !== requestingUserId) {
    throw new Error("Only the owner can demote admins");
  }

  await demoteRepo(groupId, targetUserId);
  invalidate([CACHE_KEYS.group(groupId)]);
}

/**
 * Remove a member from the group
 */
export async function removeMemberFromGroup(
  groupId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<void> {
  const group = await getStudyGroup(groupId);
  if (!group) {
    throw new Error("Study group not found");
  }

  if (!canManageGroup(group, requestingUserId)) {
    throw new Error("You don't have permission to remove members");
  }

  if (targetUserId === group.ownerId) {
    throw new Error("Cannot remove the owner");
  }

  await removeRepo(groupId, targetUserId);
  invalidate([
    CACHE_KEYS.group(groupId),
    CACHE_KEYS.userGroups(targetUserId),
  ]);
}
