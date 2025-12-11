import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { z } from "zod";
import { db } from "@/config/firebase";
import { validateRequest, errorResponse } from "@/utils/apiValidation";
import { logger } from "@/utils/logger";

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
});

type Quiz = z.infer<typeof CreateQuizSchema> & { id?: string };

// GET all quizzes from Firestore
export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "quizzes"));
    const quizzes = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Quiz[];

    return NextResponse.json(quizzes);
  } catch (error) {
    logger.error("Error fetching quizzes from Firestore:", error);
    return errorResponse("Failed to fetch quizzes", 500);
  }
}

// POST a new quiz to Firestore
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, CreateQuizSchema);
    if (!validation.success) return validation.error;

    const { title, questions } = validation.data;

    const docRef = await addDoc(collection(db, "quizzes"), {
      title,
      questions,
    });

    // Construct response object with Firestore's auto-generated ID
    const newQuiz: Quiz = {
      id: docRef.id,
      title,
      questions,
    };

    return NextResponse.json(newQuiz);
  } catch (error) {
    logger.error("Error creating quiz:", error);
    return errorResponse("Failed to create quiz", 500);
  }
}
