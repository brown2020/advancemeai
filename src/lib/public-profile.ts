import { toMillis } from "@/utils/timestamp";
import type { UserRole } from "@/types/user-profile";

export type PublicProfile = {
  uid: string;
  displayName?: string;
  username?: string;
  role: UserRole;
  photoUrl?: string;
  school?: string;
  createdAt: number;
  updatedAt: number;
};

const SENSITIVE_KEYS = ["email", "subscription", "subscriptionExpiresAt"] as const;

export function toPublicProfile(
  id: string,
  data: Record<string, unknown>
): PublicProfile {
  const role: UserRole = data.role === "teacher" ? "teacher" : "student";
  const profile: PublicProfile = {
    uid: id,
    role,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };

  if (typeof data.displayName === "string" && data.displayName.trim()) {
    profile.displayName = data.displayName;
  }
  if (typeof data.username === "string" && data.username.trim()) {
    profile.username = data.username;
  }
  if (typeof data.photoUrl === "string" && data.photoUrl.startsWith("https://")) {
    profile.photoUrl = data.photoUrl;
  }
  if (typeof data.school === "string" && data.school.trim()) {
    profile.school = data.school;
  }

  for (const key of SENSITIVE_KEYS) {
    if (key in profile) {
      delete (profile as Record<string, unknown>)[key];
    }
  }

  return profile;
}
