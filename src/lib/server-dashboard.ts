import { getAdminDbOptional } from "@/config/firebase-admin";
import { mapFlashcardSet, toMillis } from "@/lib/server-firestore";
import { pickContinueStudying } from "@/lib/dashboard-continue";
import { getLevelFromXP } from "@/types/gamification";
import type { DashboardData } from "@/types/dashboard";
import { logger } from "@/utils/logger";

const RECENT_SET_LIMIT = 6;

export async function loadDashboardData(
  userId: string
): Promise<DashboardData | null> {
  const db = getAdminDbOptional();
  if (!db) return null;

  try {
    const [setsSnap, gamificationSnap, practiceSnap, progressSnap] =
      await Promise.all([
        db
          .collection("flashcardSets")
          .where("userId", "==", userId)
          .orderBy("updatedAt", "desc")
          .limit(RECENT_SET_LIMIT)
          .get(),
        db
          .collection("users")
          .doc(userId)
          .collection("gamification")
          .doc("data")
          .get(),
        db
          .collection("practiceAttempts")
          .where("userId", "==", userId)
          .orderBy("createdAt", "desc")
          .limit(1)
          .get()
          .catch((error) => {
            logger.warn(
              "Dashboard: practiceAttempts query unavailable (index may be missing)",
              error
            );
            return null;
          }),
        db
          .collection("users")
          .doc(userId)
          .collection("flashcardStudyProgress")
          .orderBy("updatedAt", "desc")
          .limit(1)
          .get(),
      ]);

    const recentSets = setsSnap.docs.map((doc) =>
      mapFlashcardSet(doc.id, doc.data() as Record<string, unknown>)
    );

    let gamification: DashboardData["gamification"] = null;
    if (gamificationSnap.exists) {
      const g = gamificationSnap.data() as Record<string, unknown>;
      const xp = typeof g.xp === "number" ? g.xp : 0;
      gamification = {
        xp,
        level:
          typeof g.level === "number" ? g.level : getLevelFromXP(xp),
        currentStreak:
          typeof g.currentStreak === "number" ? g.currentStreak : 0,
      };
    }

    let lastPractice: { sectionId: string; at: number } | null = null;
    if (practiceSnap && !practiceSnap.empty) {
      const doc = practiceSnap.docs[0];
      if (doc) {
        const data = doc.data() as Record<string, unknown>;
        const sectionId = String(data.sectionId ?? "");
        if (sectionId) {
          lastPractice = {
            sectionId,
            at: toMillis(data.createdAt),
          };
        }
      }
    }

    let lastFlashcard: { setId: string; title: string; at: number } | null =
      null;
    if (!progressSnap.empty) {
      const progressDoc = progressSnap.docs[0];
      if (progressDoc) {
        const data = progressDoc.data() as Record<string, unknown>;
        const setDoc = await db
          .collection("flashcardSets")
          .doc(progressDoc.id)
          .get();
        const title = setDoc.exists
          ? String((setDoc.data() as Record<string, unknown>).title ?? "")
          : "";
        lastFlashcard = {
          setId: progressDoc.id,
          title,
          at: toMillis(data.updatedAt),
        };
      }
    }

    const continueStudying = pickContinueStudying(lastPractice, lastFlashcard);

    return {
      recentSets,
      continueStudying,
      gamification,
    };
  } catch (error) {
    logger.error("Failed to load dashboard data:", error);
    return null;
  }
}
