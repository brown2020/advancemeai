import {
  getUserProfile as getRepo,
  createUserProfile as createRepo,
  upsertUserProfile as upsertRepo,
} from "@/api/firebase/userProfileRepository";
import type {
  UserProfile,
  CreateUserProfileInput,
} from "@/types/user-profile";
import type { PublicProfile } from "@/lib/public-profile";

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
  const response = await fetch(
    `/api/users/by-username?username=${encodeURIComponent(username)}`
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error("Failed to load profile");
  }
  const profile = (await response.json()) as PublicProfile;
  return {
    uid: profile.uid,
    email: "",
    displayName: profile.displayName,
    username: profile.username,
    role: profile.role,
    subscription: "free",
    photoUrl: profile.photoUrl,
    school: profile.school,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
