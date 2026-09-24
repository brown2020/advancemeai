import {
  getUserProfile as getRepo,
  createUserProfile as createRepo,
  upsertUserProfile as upsertRepo,
  getUserProfileByUsername as getByUsernameRepo,
} from "@/api/firebase/userProfileRepository";
import type {
  UserProfile,
  CreateUserProfileInput,
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
 * Create or update user profile (for OAuth sign-ins where profile might already exist)
 */
export async function upsertUserProfile(
  input: CreateUserProfileInput
): Promise<UserProfile> {
  return upsertRepo(input);
}

/**
 * Get user profile by username (for public profile pages)
 */
export async function getUserProfileByUsername(
  username: string
): Promise<UserProfile | null> {
  return getByUsernameRepo(username);
}
