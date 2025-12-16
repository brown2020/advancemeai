import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateRequest, errorResponse } from "@/utils/apiValidation";
import { logger } from "@/utils/logger";
import { getAdminDbOptional } from "@/config/firebase-admin";
import { verifySessionFromRequest } from "@/lib/server-auth";

const GetQuizSchema = z.object({
  quizId: z.string().min(1, "Quiz ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, GetQuizSchema);
    if (!validation.success) return validation.error;

    const { quizId } = validation.data;

    const db = getAdminDbOptional();
    if (!db) {
      return errorResponse("Server missing credentials", 500);
    }

    const snapshot = await db.collection("quizzes").doc(quizId).get();

    if (!snapshot.exists) {
      return errorResponse("Quiz not found", 404);
    }

    // Return the Firestore doc data with the quiz ID included
    const session = await verifySessionFromRequest(request);
    const userId = session?.uid || null;
    const data = (snapshot.data() || {}) as Record<string, unknown>;
    const isLegacyPublic = !Object.prototype.hasOwnProperty.call(data, "isPublic");
    const isPublic = data.isPublic === true || isLegacyPublic;
    const isOwner = Boolean(userId) && data.userId === userId;
    if (!isPublic && !isOwner) {
      return errorResponse("Forbidden", 403);
    }

    const quizData = { id: snapshot.id, ...data };
    return NextResponse.json(quizData);
  } catch (error) {
    logger.error("Error retrieving quiz:", error);
    return errorResponse("Failed to retrieve quiz", 500);
  }
}
