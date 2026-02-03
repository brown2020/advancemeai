import {
  getUserProfile as getRepo,
  createUserProfile as createRepo,
  updateUserProfile as updateRepo,
  upsertUserProfile as upsertRepo,
  isUsernameAvailable as checkUsernameRepo,
  getUserProfileByUsername as getByUsernameRepo,
} from "@/api/firebase/userProfileRepository";
import type {
  UserProfile,
  CreateUserProfileInput,
  UpdateUserProfileInput,
  UserRole,
} from "@/types/user-profile";

/**
 * Get a user's profile
 */
export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  return getRepo(userId);
}

/**
 * Create a new user profile during signup
 */
export async function createUserProfile(
  input: CreateUserProfileInput
): Promise<UserProfile> {
  return createRepo(input);
}

/**
 * Update a user's profile
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput
): Promise<void> {
  return updateRepo(userId, input);
}

/**
 * Create or update user profile (for OAuth sign-ins where profile might already exist)
 */
export async function upsertUserProfile(
  input: CreateUserProfileInput
): Promise<UserProfile> {
  return upsertRepo(input);
}

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  return checkUsernameRepo(username);
}

/**
 * Get user profile by username (for public profile pages)
 */
export async function getUserProfileByUsername(
  username: string
): Promise<UserProfile | null> {
  return getByUsernameRepo(username);
}

/**
 * Update user's role
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  return updateRepo(userId, { role });
}

/**
 * Check if user is a teacher
 */
export async function checkIsTeacher(userId: string): Promise<boolean> {
  const profile = await getRepo(userId);
  return profile?.role === "teacher";
}
