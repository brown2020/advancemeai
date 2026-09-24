/**
 * Class Service
 * Business logic for teacher-led classes
 * Wraps studyGroupService with teacher-only gating and class-specific logic
 */

import {
  createStudyGroup,
  getStudyGroup,
  getUserStudyGroups,
  shareSetWithGroup,
  unshareSetFromGroup,
} from "./studyGroupService";
import { getUserProfile } from "./userProfileService";
import { isTeacher } from "@/types/user-profile";
import type { Class, CreateClassInput } from "@/types/class";
import { toStudyGroupInput, isClass, canManageGroup } from "@/types/class";

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
async function getClass(classId: string): Promise<Class | null> {
  const group = await getStudyGroup(classId);
  if (!group || !isClass(group)) return null;
  return group;
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
 * Load a class and ensure the user can manage it
 */
async function requireManagedClass(
  classId: string,
  userId: string,
  action: string
): Promise<void> {
  const cls = await getClass(classId);
  if (!cls) {
    throw new Error("Class not found");
  }

  if (!canManageGroup(cls, userId)) {
    throw new Error(`Only class owners and admins can ${action}`);
  }
}

/**
 * Add a set to a class (teacher/admin only)
 */
export async function addSetToClass(
  classId: string,
  setId: string,
  userId: string
): Promise<void> {
  await requireManagedClass(classId, userId, "add sets");
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
  await requireManagedClass(classId, userId, "remove sets");
  return unshareSetFromGroup(classId, setId, userId);
}
