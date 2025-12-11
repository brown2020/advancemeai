import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { db } from "@/config/firebase";
import { validateRequest, errorResponse } from "@/utils/apiValidation";
import { logger } from "@/utils/logger";

const GetQuizSchema = z.object({
  quizId: z.string().min(1, "Quiz ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, GetQuizSchema);
    if (!validation.success) return validation.error;

    const { quizId } = validation.data;

    const quizDocRef = doc(db, "quizzes", quizId);
    const snapshot = await getDoc(quizDocRef);

    if (!snapshot.exists()) {
      return errorResponse("Quiz not found", 404);
    }

    // Return the Firestore doc data with the quiz ID included
    const quizData = { id: snapshot.id, ...snapshot.data() };
    return NextResponse.json(quizData);
  } catch (error) {
    logger.error("Error retrieving quiz:", error);
    return errorResponse("Failed to retrieve quiz", 500);
  }
}
