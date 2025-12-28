import {
  getUserPreferences as getRepo,
  upsertUserPreferences as upsertRepo,
} from "@/api/firebase/userPreferencesRepository";
import type { UserPreferences } from "@/types/user-preferences";

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  return getRepo(userId);
}

export async function saveUserPreferences(args: {
  userId: string;
  preferences: UserPreferences;
}) {
  return upsertRepo(args);
}


