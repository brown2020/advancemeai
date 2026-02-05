/**
 * Study Group Service
 * Business logic for study groups
 */

import {
  createStudyGroup as createGroupRepo,
  getStudyGroup as getGroupRepo,
  getStudyGroupByInviteCode as getGroupByCodeRepo,
  getUserStudyGroups as getUserGroupsRepo,
  updateStudyGroup as updateGroupRepo,
  deleteStudyGroup as deleteGroupRepo,
  joinStudyGroup as joinGroupRepo,
  leaveStudyGroup as leaveGroupRepo,
  shareSetWithGroup as shareSetRepo,
  unshareSetFromGroup as unshareSetRepo,
  regenerateInviteCode as regenerateCodeRepo,
  getGroupActivity as getActivityRepo,
  addGroupActivity as addActivityRepo,
  promoteMemberToAdmin as promoteRepo,
  demoteAdminToMember as demoteRepo,
  removeMemberFromGroup as removeRepo,
} from "@/api/firebase/studyGroupRepository";
import type {
  StudyGroup,
  GroupActivity,
  CreateStudyGroupInput,
} from "@/types/study-group";
import { canManageGroup, getAllMemberIds } from "@/types/study-group";
import { createCachedService } from "@/utils/cachedService";
import { getFlashcardSet } from "@/services/flashcardService";

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

/**
 * Get a study group by invite code
 */
export async function getStudyGroupByInviteCode(
  inviteCode: string
): Promise<StudyGroup | null> {
  // Don't cache invite code lookups
  return getGroupByCodeRepo(inviteCode);
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
 * Update a study group
 */
export async function updateStudyGroup(
  groupId: string,
  userId: string,
  updates: Partial<Pick<StudyGroup, "name" | "description" | "isPublic">>
): Promise<void> {
  const group = await getStudyGroup(groupId);
  if (!group) {
    throw new Error("Study group not found");
  }

  if (!canManageGroup(group, userId)) {
    throw new Error("You don't have permission to update this group");
  }

  await cachedFetch({
    cacheKey: "",
    fetchData: () => updateGroupRepo(groupId, updates),
    invalidateKeys: [
      CACHE_KEYS.group(groupId),
      CACHE_KEYS.userGroups(userId),
    ],
    logMessage: `Updating study group: ${groupId}`,
  });
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
export async function joinStudyGroup(
  groupId: string,
  userId: string
): Promise<void> {
  const group = await getStudyGroup(groupId);
  if (!group) {
    throw new Error("Study group not found");
  }

  // Check if already a member
  if (getAllMemberIds(group).includes(userId)) {
    throw new Error("You are already a member of this group");
  }

  await cachedFetch({
    cacheKey: "",
    fetchData: () => joinGroupRepo(groupId, userId),
    invalidateKeys: [
      CACHE_KEYS.group(groupId),
      CACHE_KEYS.userGroups(userId),
      CACHE_KEYS.groupActivity(groupId),
    ],
    logMessage: `User ${userId} joining group: ${groupId}`,
  });
}

/**
 * Join a study group by invite code
 */
export async function joinStudyGroupByCode(
  inviteCode: string,
  userId: string
): Promise<StudyGroup> {
  const group = await getStudyGroupByInviteCode(inviteCode);
  if (!group) {
    throw new Error("Invalid invite code");
  }

  await joinStudyGroup(group.id, userId);

  // Return the updated group
  const updatedGroup = await getStudyGroup(group.id);
  return updatedGroup!;
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

  await cachedFetch({
    cacheKey: "",
    fetchData: () => leaveGroupRepo(groupId, userId),
    invalidateKeys: [
      CACHE_KEYS.group(groupId),
      CACHE_KEYS.userGroups(userId),
      CACHE_KEYS.groupActivity(groupId),
    ],
    logMessage: `User ${userId} leaving group: ${groupId}`,
  });
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

  // Check if user is a member
  if (!getAllMemberIds(group).includes(userId)) {
    throw new Error("You must be a member to share sets with this group");
  }

  // Verify the user owns the set they're sharing
  try {
    const flashcardSet = await getFlashcardSet(setId);
    if (flashcardSet.userId !== userId && !flashcardSet.isPublic) {
      throw new Error("You can only share sets you own or public sets");
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
 * Record a study session activity in the group
 */
export async function recordGroupStudyActivity(
  groupId: string,
  userId: string,
  metadata: {
    setId?: string;
    setTitle?: string;
    cardsStudied?: number;
    xpEarned?: number;
  }
): Promise<void> {
  await addActivityRepo(groupId, userId, "study_session", metadata);
  invalidate([CACHE_KEYS.groupActivity(groupId)]);
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
