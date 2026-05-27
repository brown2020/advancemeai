import { getAdminDbOptional } from "@/config/firebase-admin";
import { mapFlashcardSet, toMillis } from "@/lib/server-firestore";
import {
  aggregateClassProgress,
  type MemberProgressEntry,
  type SharedSetInfo,
} from "@/lib/class-progress-aggregate";
import type { ClassProgressDashboardData } from "@/types/class-progress";
import type { StudyGroup } from "@/types/study-group";
import { canManageGroup } from "@/types/study-group";
import { logger } from "@/utils/logger";

function mapStudyGroup(id: string, data: Record<string, unknown>): StudyGroup {
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    ownerId: String(data.ownerId ?? ""),
    memberIds: Array.isArray(data.memberIds)
      ? (data.memberIds as string[])
      : [],
    adminIds: Array.isArray(data.adminIds)
      ? (data.adminIds as string[])
      : [],
    inviteCode: String(data.inviteCode ?? ""),
    isPublic: data.isPublic === true,
    sharedSetIds: Array.isArray(data.sharedSetIds)
      ? (data.sharedSetIds as string[])
      : [],
    isClass: data.isClass === true,
    school: typeof data.school === "string" ? data.school : undefined,
    subject: typeof data.subject === "string" ? data.subject : undefined,
    folderIds: Array.isArray(data.folderIds)
      ? (data.folderIds as string[])
      : undefined,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

/**
 * Server-side class progress (Firebase Admin). Teachers only.
 */
export async function loadClassProgressForGroup(
  groupId: string,
  viewerUserId: string
): Promise<ClassProgressDashboardData | null> {
  const db = getAdminDbOptional();
  if (!db) return null;

  const groupSnap = await db.collection("studyGroups").doc(groupId).get();
  if (!groupSnap.exists) return null;

  const group = mapStudyGroup(
    groupSnap.id,
    groupSnap.data() as Record<string, unknown>
  );

  if (!canManageGroup(group, viewerUserId)) {
    return null;
  }

  const studentIds = group.memberIds;
  const sharedSetIds = group.sharedSetIds;

  if (sharedSetIds.length === 0) {
    return {
      className: group.name,
      totalStudents: studentIds.length,
      activeStudents: 0,
      averageMastery: 0,
      setStatistics: [],
      studentSummaries: studentIds.map((userId) => ({
        userId,
        displayName: `Student ${userId.slice(0, 6)}`,
        role: "student" as const,
        overallMastery: 0,
        setsCompleted: 0,
        totalSets: 0,
        totalTimeSpentSeconds: 0,
      })),
    };
  }

  const sharedSets: SharedSetInfo[] = [];
  for (const setId of sharedSetIds) {
    try {
      const setSnap = await db.collection("flashcardSets").doc(setId).get();
      if (!setSnap.exists) continue;
      const set = mapFlashcardSet(
        setSnap.id,
        setSnap.data() as Record<string, unknown>
      );
      sharedSets.push({
        id: set.id,
        title: set.title,
        totalCards: set.cards.length,
      });
    } catch (error) {
      logger.warn(`Class progress: could not load set ${setId}`, error);
    }
  }

  const progressByStudent: Record<
    string,
    Record<string, MemberProgressEntry>
  > = {};
  const profilesByStudent: Record<
    string,
    { displayName: string; email?: string }
  > = {};

  await Promise.all(
    studentIds.map(async (studentId) => {
      const [progressSnap, profileSnap] = await Promise.all([
        db
          .collection("users")
          .doc(studentId)
          .collection("flashcardStudyProgress")
          .get(),
        db
          .collection("users")
          .doc(studentId)
          .collection("profile")
          .doc("data")
          .get(),
      ]);

      if (profileSnap.exists) {
        const p = profileSnap.data() as Record<string, unknown>;
        const email =
          typeof p.email === "string" ? p.email : undefined;
        profilesByStudent[studentId] = {
          displayName:
            (typeof p.displayName === "string" && p.displayName) ||
            email?.split("@")[0] ||
            `Student ${studentId.slice(0, 6)}`,
          email,
        };
      } else {
        profilesByStudent[studentId] = {
          displayName: `Student ${studentId.slice(0, 6)}`,
        };
      }

      const bySet: Record<string, MemberProgressEntry> = {};
      progressSnap.forEach((doc) => {
        if (!sharedSetIds.includes(doc.id)) return;
        const data = doc.data() as Record<string, unknown>;
        const mastery = data.masteryByCardId;
        bySet[doc.id] = {
          masteryByCardId:
            mastery && typeof mastery === "object"
              ? (mastery as Record<string, 0 | 1 | 2 | 3>)
              : {},
          updatedAt: toMillis(data.updatedAt),
        };
      });
      progressByStudent[studentId] = bySet;
    })
  );

  const aggregate = aggregateClassProgress(
    sharedSets,
    studentIds,
    progressByStudent,
    profilesByStudent
  );

  return {
    className: group.name,
    ...aggregate,
  };
}
