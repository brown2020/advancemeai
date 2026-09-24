/**
 * User Profile type definitions
 * Includes roles (student/teacher) and subscription tiers per SPEC.md
 */

import type { Timestamp, UserId } from "./common";

/**
 * User role - determines available features
 * - student: Default role, can study and create content
 * - teacher: Can create classes, track student progress, host live games
 */
export type UserRole = "student" | "teacher";

/**
 * Subscription tier - determines feature access
 * - free: Basic features
 * - plus: Premium features (Learn mode, Study Guides, etc.)
 * - plus_teacher: Teacher-specific premium features
 */
type SubscriptionTier = "free" | "plus" | "plus_teacher";

/**
 * User profile stored in Firestore
 */
export interface UserProfile {
  uid: UserId;
  email: string;
  displayName?: string;
  /** Unique username for public profile URLs */
  username?: string;
  /** User's role - student or teacher */
  role: UserRole;
  /** Subscription tier for feature gating */
  subscription: SubscriptionTier;
  /** Subscription expiry date (if applicable) */
  subscriptionExpiresAt?: Timestamp;
  /** Profile photo URL */
  photoUrl?: string;
  /** User's school or institution */
  school?: string;
  /** User's country/region for localization */
  region?: string;
  /** Preferred language */
  language?: string;
  /** Account creation timestamp */
  createdAt: Timestamp;
  /** Last profile update timestamp */
  updatedAt: Timestamp;
}

/**
 * Input for creating a new user profile
 */
export interface CreateUserProfileInput {
  uid: UserId;
  email: string;
  displayName?: string;
  role: UserRole;
  photoUrl?: string;
}

/**
 * Input for updating user profile
 */
export interface UpdateUserProfileInput {
  displayName?: string;
  username?: string;
  role?: UserRole;
  photoUrl?: string;
  school?: string;
  region?: string;
  language?: string;
}

/**
 * Check if user has teacher role
 */
export function isTeacher(profile: UserProfile | null): boolean {
  return profile?.role === "teacher";
}

/**
 * Default values for new user profiles
 */
export const DEFAULT_USER_PROFILE: Omit<
  UserProfile,
  "uid" | "email" | "createdAt" | "updatedAt"
> = {
  role: "student",
  subscription: "free",
};
