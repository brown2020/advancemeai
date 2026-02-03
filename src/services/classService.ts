/**
 * Class Service
 * Business logic for teacher-led classes
 * Wraps studyGroupService with teacher-only gating and class-specific logic
 */

import {
  createStudyGroup,
  getStudyGroup,
  getStudyGroupByInviteCode,
  getUserStudyGroups,
  updateStudyGroup,
  deleteStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  shareSetWithGroup,
  unshareSetFromGroup,
  regenerateInviteCode,
  getGroupActivity,
  promoteMemberToAdmin,
  demoteAdminToMember,
  removeMemberFromGroup,
} from "./studyGroupService";
import { getUserProfile } from "./userProfileService";
import { isTeacher } from "@/types/user-profile";
import type { Class, CreateClassInput, ClassActivity } from "@/types/class";
import { toStudyGroupInput, isClass } from "@/types/class";
import type { StudyGroup } from "@/types/study-group";

/**
 * Create a new class (teacher-only)
 */
export async function createClass(
  userId: string,
  input: CreateClassInput
): Promise<Class> {
  // Verify user is a teacher
  const profile = await getUserProfile(userId);
  if (!isTeacher(profile)) {
    throw new Error(
      "Only teachers can create classes. Please update your role in settings."
    );
  }

  const studyGroupInput = toStudyGroupInput(input);
  const group = await createStudyGroup(userId, studyGroupInput);

  return {
    ...group,
    isClass: true,
    school: input.school,
    subject: input.subject,
  } as Class;
}

/**
 * Get a class by ID
 */
export async function getClass(classId: string): Promise<Class | null> {
  const group = await getStudyGroup(classId);
  if (!group || !isClass(group)) return null;
  return group;
}

/**
 * Get a class by invite code
 */
export async function getClassByInviteCode(
  inviteCode: string
): Promise<Class | null> {
  const group = await getStudyGroupByInviteCode(inviteCode);
  if (!group) return null;
  // Allow joining any group via invite code, but mark if it's a class
  return group as Class;
}

/**
 * Get all classes for a user
 */
export async function getUserClasses(userId: string): Promise<Class[]> {
  const groups = await getUserStudyGroups(userId);
  // Return all groups, but mark which ones are classes
  return groups.map((group) => ({
    ...group,
    isClass: group.isClass ?? false,
  })) as Class[];
}

/**
 * Get only teacher-led classes for a user
 */
export async function getUserTeacherClasses(userId: string): Promise<Class[]> {
  const groups = await getUserStudyGroups(userId);
  return groups.filter(isClass) as Class[];
}

/**
 * Update a class
 */
export async function updateClass(
  classId: string,
  userId: string,
  updates: Partial<Pick<StudyGroup, "name" | "description" | "isPublic">>
): Promise<void> {
  return updateStudyGroup(classId, userId, updates);
}

/**
 * Delete a class
 */
export async function deleteClass(
  classId: string,
  userId: string
): Promise<void> {
  return deleteStudyGroup(classId, userId);
}

/**
 * Join a class
 */
export async function joinClass(
  classId: string,
  userId: string
): Promise<void> {
  return joinStudyGroup(classId, userId);
}

/**
 * Join a class by invite code
 */
export async function joinClassByCode(
  inviteCode: string,
  userId: string
): Promise<Class> {
  const group = await getStudyGroupByInviteCode(inviteCode);
  if (!group) {
    throw new Error("Invalid invite code");
  }

  await joinStudyGroup(group.id, userId);

  const updatedGroup = await getStudyGroup(group.id);
  return updatedGroup as Class;
}

/**
 * Leave a class
 */
export async function leaveClass(
  classId: string,
  userId: string
): Promise<void> {
  return leaveStudyGroup(classId, userId);
}

/**
 * Add a set to a class (teacher/admin only)
 */
export async function addSetToClass(
  classId: string,
  setId: string,
  userId: string
): Promise<void> {
  return shareSetWithGroup(classId, setId, userId);
}

/**
 * Remove a set from a class (teacher/admin only)
 */
export async function removeSetFromClass(
  classId: string,
  setId: string,
  userId: string
): Promise<void> {
  return unshareSetFromGroup(classId, setId, userId);
}

/**
 * Regenerate class invite code
 */
export async function regenerateClassInviteCode(
  classId: string,
  userId: string
): Promise<string> {
  return regenerateInviteCode(classId, userId);
}

/**
 * Get class activity feed
 */
export async function getClassActivity(
  classId: string,
  limitCount = 20
): Promise<ClassActivity[]> {
  return getGroupActivity(classId, limitCount);
}

/**
 * Promote a member to admin in a class
 */
export async function promoteClassMemberToAdmin(
  classId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<void> {
  return promoteMemberToAdmin(classId, targetUserId, requestingUserId);
}

/**
 * Demote an admin to member in a class
 */
export async function demoteClassAdminToMember(
  classId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<void> {
  return demoteAdminToMember(classId, targetUserId, requestingUserId);
}

/**
 * Remove a member from a class
 */
export async function removeClassMember(
  classId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<void> {
  return removeMemberFromGroup(classId, targetUserId, requestingUserId);
}
