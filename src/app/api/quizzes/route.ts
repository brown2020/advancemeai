import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateRequest, errorResponse } from "@/utils/apiValidation";
import { logger } from "@/utils/logger";
import { getAdminDbOptional } from "@/config/firebase-admin";
import { verifySessionFromRequest } from "@/lib/server-auth";

const QuizQuestionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswer: z.string().min(1),
});

const CreateQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  questions: z
    .array(QuizQuestionSchema)
    .min(1, "At least one question required"),
  isPublic: z.boolean().optional(),
});

type Quiz = z.infer<typeof CreateQuizSchema> & { id?: string };

/**
 * Retrieves all quizzes visible to the current user
 * @param request - HTTP request
 * @returns List of quizzes or error response
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const db = getAdminDbOptional();
    if (!db) {
      return errorResponse("Server missing credentials", 500);
    }

    const session = await verifySessionFromRequest(request);
    const userId = session?.uid ?? null;

    // Lean + correct visibility: read a bounded set, then filter by
    // - public quizzes (isPublic === true)
    // - legacy public quizzes (missing isPublic)
    // - owner quizzes (userId matches)
    const snapshot = await db
      .collection("quizzes")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const quizzes = snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
      .filter((quiz) => {
        const q = quiz as Record<string, unknown>;
        const isLegacyPublic = !Object.prototype.hasOwnProperty.call(
          q,
          "isPublic"
        );
        const isPublic = q.isPublic === true || isLegacyPublic;
        const isOwner = Boolean(userId) && q.userId === userId;
        return isPublic || isOwner;
      }) as Quiz[];

    return NextResponse.json(quizzes);
  } catch (error) {
    logger.error("Error fetching quizzes from Firestore:", error);
    return errorResponse("Failed to fetch quizzes", 500);
  }
}

/**
 * Creates a new quiz
 * @param request - HTTP request with quiz data
 * @returns Created quiz or error response
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const validation = await validateRequest(request, CreateQuizSchema);
    if (!validation.success) return validation.error;

    const db = getAdminDbOptional();
    if (!db) {
      return errorResponse("Server missing credentials", 500);
    }

    const session = await verifySessionFromRequest(request);
    if (!session?.uid) {
      return errorResponse("Unauthorized", 401);
    }

    const { title, questions, isPublic } = validation.data;
    const now = Date.now();

    const docRef = await db.collection("quizzes").add({
      title,
      questions,
      userId: session.uid,
      isPublic: Boolean(isPublic),
      createdAt: now,
      updatedAt: now,
    });

    // Construct response object with Firestore's auto-generated ID
    const newQuiz: Quiz = {
      id: docRef.id,
      title,
      questions,
      isPublic: Boolean(isPublic),
    };

    return NextResponse.json(newQuiz);
  } catch (error) {
    logger.error("Error creating quiz:", error);
    return errorResponse("Failed to create quiz", 500);
  }
}
