import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { AppError, ErrorType, logError } from "@/utils/errorUtils";
import type {
  UserProfile,
  CreateUserProfileInput,
  UpdateUserProfileInput,
} from "@/types/user-profile";
import { DEFAULT_USER_PROFILE } from "@/types/user-profile";

/**
 * Get the document reference for a user profile
 */
function profileDocRef(userId: string) {
  return doc(db, "users", userId, "profile", "data");
}

/**
 * Get a user profile by user ID
 */
export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  try {
    const ref = profileDocRef(userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to load user profile", ErrorType.UNKNOWN);
  }
}

/**
 * Create a new user profile
 */
export async function createUserProfile(
  input: CreateUserProfileInput
): Promise<UserProfile> {
  try {
    const now = Date.now();
    const profile: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      uid: input.uid,
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      photoUrl: input.photoUrl,
      createdAt: now,
      updatedAt: now,
    };

    const ref = profileDocRef(input.uid);
    await setDoc(ref, {
      ...profile,
      updatedAt: serverTimestamp(),
    });

    return profile;
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to create user profile", ErrorType.UNKNOWN);
  }
}

/**
 * Update an existing user profile
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput
): Promise<void> {
  try {
    const ref = profileDocRef(userId);
    await updateDoc(ref, {
      ...input,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to update user profile", ErrorType.UNKNOWN);
  }
}

/**
 * Create or update user profile (upsert)
 */
export async function upsertUserProfile(
  input: CreateUserProfileInput
): Promise<UserProfile> {
  try {
    const existing = await getUserProfile(input.uid);
    if (existing) {
      await updateUserProfile(input.uid, {
        displayName: input.displayName,
        photoUrl: input.photoUrl,
        // Don't overwrite role on existing profiles unless explicitly specified
      });
      return {
        ...existing,
        displayName: input.displayName ?? existing.displayName,
        photoUrl: input.photoUrl ?? existing.photoUrl,
        updatedAt: Date.now(),
      };
    }
    return createUserProfile(input);
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to upsert user profile", ErrorType.UNKNOWN);
  }
}

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    // Query all user profiles for this username
    // Note: This requires a Firestore index on username
    // We need to query subcollection across all users, which requires a collection group query
    const profilesRef = collection(db, "userProfiles");
    const q = query(
      profilesRef,
      where("username", "==", username.toLowerCase()),
      limit(1)
    );
    const snap = await getDocs(q);
    return snap.empty;
  } catch (error) {
    logError(error);
    // If query fails, assume username is taken for safety
    return false;
  }
}

/**
 * Get user profile by username
 */
export async function getUserProfileByUsername(
  username: string
): Promise<UserProfile | null> {
  try {
    const profilesRef = collection(db, "userProfiles");
    const q = query(
      profilesRef,
      where("username", "==", username.toLowerCase()),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0]!.data() as UserProfile;
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to find user profile", ErrorType.UNKNOWN);
  }
}
