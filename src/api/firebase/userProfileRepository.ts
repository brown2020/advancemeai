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
import { getClientDb } from "@/config/firebase";
import { rethrowAsAppError } from "@/utils/errorUtils";
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
  return doc(getClientDb(), "users", userId, "profile", "data");
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
    rethrowAsAppError(error, "Failed to load user profile");
  }
}

function withoutUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
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
    // Firestore rejects `undefined` values (e.g. no photoURL for email sign-ups).
    await setDoc(ref, {
      ...withoutUndefined(profile),
      updatedAt: serverTimestamp(),
    });

    return profile;
  } catch (error) {
    rethrowAsAppError(error, "Failed to create user profile");
  }
}

/**
 * Update an existing user profile
 */
async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput
): Promise<void> {
  try {
    const ref = profileDocRef(userId);
    await updateDoc(ref, {
      ...withoutUndefined(input),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    rethrowAsAppError(error, "Failed to update user profile");
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
    rethrowAsAppError(error, "Failed to upsert user profile");
  }
}

/**
 * Get user profile by username
 */
export async function getUserProfileByUsername(
  username: string
): Promise<UserProfile | null> {
  try {
    const profilesRef = collection(getClientDb(), "userProfiles");
    const q = query(
      profilesRef,
      where("username", "==", username.toLowerCase()),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0]!.data() as UserProfile;
  } catch (error) {
    rethrowAsAppError(error, "Failed to find user profile");
  }
}
