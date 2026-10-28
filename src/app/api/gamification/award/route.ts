import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDbOptional } from "@/config/firebase-admin";
import {
  applyGamificationAward,
  GAMIFICATION_LIMITS,
  type GamificationAwardInput,
} from "@/lib/gamification-award";
import { consumeRateLimit } from "@/lib/rate-limit";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { toMillis } from "@/utils/timestamp";
import { errorResponse } from "@/utils/apiValidation";
import { logger } from "@/utils/logger";
import type { AchievementId, GamificationData } from "@/types/gamification";
import { createDefaultGamificationData } from "@/types/gamification";

const achievementIds = [
  "first-steps",
  "on-fire",
  "perfectionist",
  "card-shark",
  "speed-demon",
  "night-owl",
  "early-bird",
  "dedicated",
  "sat-ready",
  "social-butterfly",
] as const;

const awardSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("session"),
    cardsStudied: z.number().int().min(0).max(GAMIFICATION_LIMITS.cardsStudied).optional(),
    cardsMastered: z.number().int().min(0).max(GAMIFICATION_LIMITS.cardsMastered).optional(),
    questionsAnswered: z.number().int().min(0).max(GAMIFICATION_LIMITS.questionsAnswered).optional(),
    questionsCorrect: z.number().int().min(0).max(GAMIFICATION_LIMITS.questionsCorrect).optional(),
    isPerfectScore: z.boolean().optional(),
    durationSeconds: z.number().int().min(0).max(GAMIFICATION_LIMITS.durationSeconds).optional(),
    isFullTest: z.boolean().optional(),
  }),
  z.object({ kind: z.literal("activity") }),
  z.object({
    kind: z.literal("achievement"),
    achievementId: z.enum(achievementIds),
  }),
]);

function mapStored(userId: string, data: Record<string, unknown>): GamificationData {
  const defaults = createDefaultGamificationData(userId);
  return {
    ...defaults,
    userId,
    xp: typeof data.xp === "number" ? data.xp : 0,
    level: typeof data.level === "number" ? data.level : 1,
    currentStreak: typeof data.currentStreak === "number" ? data.currentStreak : 0,
    longestStreak: typeof data.longestStreak === "number" ? data.longestStreak : 0,
    lastStudyDate: data.lastStudyDate ? toMillis(data.lastStudyDate) : null,
    achievements: Array.isArray(data.achievements)
      ? (data.achievements.filter((id) => typeof id === "string") as AchievementId[])
      : [],
    achievementDates:
      data.achievementDates && typeof data.achievementDates === "object"
        ? (data.achievementDates as GamificationData["achievementDates"])
        : ({} as GamificationData["achievementDates"]),
    totalCardsStudied: typeof data.totalCardsStudied === "number" ? data.totalCardsStudied : 0,
    totalCardsMastered: typeof data.totalCardsMastered === "number" ? data.totalCardsMastered : 0,
    totalQuestionsAnswered:
      typeof data.totalQuestionsAnswered === "number" ? data.totalQuestionsAnswered : 0,
    perfectScores: typeof data.perfectScores === "number" ? data.perfectScores : 0,
    totalStudySessions: typeof data.totalStudySessions === "number" ? data.totalStudySessions : 0,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export async function POST(request: NextRequest) {
  const session = await verifySessionFromRequest(request);
  if (!session) return errorResponse("Unauthorized", 401);

  const limit = consumeRateLimit(`xp:${session.uid}`, 30, 10 * 60 * 1000);
  if (!limit.ok) {
    const response = errorResponse("Too many progress updates. Please wait.", 429);
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = awardSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid progress update", 400);

  const db = getAdminDbOptional();
  if (!db) return errorResponse("Database not available", 503);

  const input: GamificationAwardInput =
    parsed.data.kind === "session"
      ? {
          kind: "session",
          cardsStudied: parsed.data.cardsStudied ?? 0,
          cardsMastered: parsed.data.cardsMastered ?? 0,
          questionsAnswered: parsed.data.questionsAnswered ?? 0,
          questionsCorrect: parsed.data.questionsCorrect ?? 0,
          isPerfectScore: parsed.data.isPerfectScore ?? false,
          durationSeconds: parsed.data.durationSeconds ?? 0,
          isFullTest: parsed.data.isFullTest ?? false,
        }
      : parsed.data.kind === "activity"
        ? { kind: "activity" }
        : { kind: "achievement", achievementId: parsed.data.achievementId };

  try {
    const ref = db.collection("users").doc(session.uid).collection("gamification").doc("data");
    const snap = await ref.get();
    const current = snap.exists
      ? mapStored(session.uid, snap.data() as Record<string, unknown>)
      : null;
    const next = applyGamificationAward(current, input, session.uid);
    await ref.set({ ...next, updatedAt: Date.now() }, { merge: true });
    return NextResponse.json({
      xp: next.xp,
      level: next.level,
      currentStreak: next.currentStreak,
      achievements: next.achievements,
    });
  } catch (error) {
    logger.error("Gamification award failed", error);
    return errorResponse("Failed to save progress", 500);
  }
}
