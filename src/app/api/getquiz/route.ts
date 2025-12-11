import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

export async function POST(request: NextRequest) {
  try {
    const { quizId } = await request.json();
    if (!quizId) {
      return NextResponse.json(
        { message: "Missing quizId in request body" },
        { status: 400 }
      );
    }

    const quizDocRef = doc(db, "quizzes", quizId);
    const snapshot = await getDoc(quizDocRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    // Return the Firestore doc data with the quiz ID included
    const quizData = { id: snapshot.id, ...snapshot.data() };
    return NextResponse.json(quizData);
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Error retrieving quiz:", error);
    }
    return NextResponse.json(
      { message: "Failed to retrieve quiz" },
      { status: 500 }
    );
  }
}
