import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type FieldValue,
} from "firebase/firestore";
import { getClientDb } from "@/config/firebase";
import { rethrowAsAppError } from "@/utils/errorUtils";
import type { UserPreferences } from "@/types/user-preferences";
import { DEFAULT_USER_PREFERENCES } from "@/types/user-preferences";

type PreferencesDoc = UserPreferences & {
  userId: string;
  updatedAt: FieldValue;
};

function preferencesDocRef(userId: string) {
  return doc(getClientDb(), "users", userId, "settings", "preferences");
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    const ref = preferencesDocRef(userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return DEFAULT_USER_PREFERENCES;
    const data = snap.data() as Partial<PreferencesDoc>;
    return {
      theme: (data.theme ?? DEFAULT_USER_PREFERENCES.theme) as UserPreferences["theme"],
      emailNotifications: Boolean(
        data.emailNotifications ?? DEFAULT_USER_PREFERENCES.emailNotifications
      ),
    };
  } catch (error) {
    rethrowAsAppError(error, "Failed to load preferences");
  }
}

export async function upsertUserPreferences(args: {
  userId: string;
  preferences: UserPreferences;
}): Promise<void> {
  try {
    const ref = preferencesDocRef(args.userId);
    await setDoc(
      ref,
      {
        userId: args.userId,
        ...args.preferences,
        updatedAt: serverTimestamp(),
      } satisfies PreferencesDoc,
      { merge: true }
    );
  } catch (error) {
    rethrowAsAppError(error, "Failed to save preferences");
  }
}

