// src/app/api/getquizzes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { quizzes } from "../../../data/quizzes"; // Import the quizzes array

export async function GET(request: NextRequest) {
  try {
    // Parse the request body to extract quizId
    const body = await request.json();
    const quizId = body.quizId;

    if (!quizId) {
      return NextResponse.json(
        { message: "Missing quizId in request body" },
        { status: 400 }
      );
    }

    // Find the quiz using the quizzes array
    const quiz = quizzes.find((q) => q.id === quizId);

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error retrieving quiz:", error);
    return NextResponse.json(
      { message: "Failed to retrieve quiz" },
      { status: 500 }
    );
  }
}
