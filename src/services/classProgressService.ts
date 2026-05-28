/**
 * Class progress service — fetches aggregated progress for group managers.
 */

import type { ClassProgressDashboardData } from "@/types/class-progress";

export type { ClassProgressDashboardData };

/**
 * Loads class progress via server API (requires manager role; returns null for 403).
 */
export async function fetchClassProgressForGroup(
  groupId: string
): Promise<ClassProgressDashboardData | null> {
  const response = await fetch(`/api/groups/${groupId}/progress`, {
    credentials: "include",
  });

  if (response.status === 403 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? "Failed to load class progress");
  }

  return response.json() as Promise<ClassProgressDashboardData>;
}
