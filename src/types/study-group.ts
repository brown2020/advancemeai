/**
 * Study Group type definitions
 */

import type { Timestamp, UserId } from "./common";

export type StudyGroupId = string;
export type ActivityId = string;

/**
 * Member roles within a study group
 */
export type MemberRole = "owner" | "admin" | "member";

/**
 * Study group/class data structure
 * This type supports both casual study groups and teacher-led classes
 */
export interface StudyGroup {
  id: StudyGroupId;
  name: string;
  description: string;
  ownerId: UserId;
  memberIds: UserId[];
  adminIds: UserId[];
  inviteCode: string;
  isPublic: boolean;
  sharedSetIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** School or institution name (for teacher classes) */
  school?: string;
  /** Whether this is a teacher-led class (enables class progress tracking) */
  isClass?: boolean;
  /** Subject or topic of the class */
  subject?: string;
  /** Folder IDs shared with the class */
  folderIds?: string[];
}

/**
 * Activity types for group feed
 */
export type ActivityType =
  | "study_session"
  | "share_set"
  | "join_group"
  | "leave_group"
  | "achievement"
  | "level_up";

/**
 * Activity feed item
 */
export interface GroupActivity {
  id: ActivityId;
  groupId: StudyGroupId;
  userId: UserId;
  type: ActivityType;
  metadata: Record<string, unknown>;
  createdAt: Timestamp;
}

/**
 * Study group member with metadata
 */
export interface GroupMember {
  id: UserId;
  role: MemberRole;
  joinedAt: Timestamp;
  displayName?: string;
  email?: string;
  xp?: number;
  level?: number;
}

/**
 * Group leaderboard entry
 */
export interface LeaderboardEntry {
  userId: UserId;
  displayName: string;
  xp: number;
  level: number;
  rank: number;
}

/**
 * Form data for creating a study group or class
 */
export interface CreateStudyGroupInput {
  name: string;
  description: string;
  isPublic: boolean;
  /** Create as a teacher-led class */
  isClass?: boolean;
  /** School or institution name (for classes) */
  school?: string;
  /** Subject or topic (for classes) */
  subject?: string;
}

/**
 * Updates allowed on a study group
 */
export interface UpdateStudyGroupInput {
  name?: string;
  description?: string;
  isPublic?: boolean;
  school?: string;
  subject?: string;
}

/**
 * Generate a random invite code
 */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars like 0/O, 1/I/L
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get user's role in a group
 */
export function getUserRole(
  group: StudyGroup,
  userId: UserId
): MemberRole | null {
  if (group.ownerId === userId) return "owner";
  if (group.adminIds.includes(userId)) return "admin";
  if (group.memberIds.includes(userId)) return "member";
  return null;
}

/**
 * Check if user can manage group (owner or admin)
 */
export function canManageGroup(group: StudyGroup, userId: UserId): boolean {
  return group.ownerId === userId || group.adminIds.includes(userId);
}

/**
 * Get all member IDs including owner and admins
 */
export function getAllMemberIds(group: StudyGroup): UserId[] {
  return Array.from(
    new Set([group.ownerId, ...group.adminIds, ...group.memberIds])
  );
}
