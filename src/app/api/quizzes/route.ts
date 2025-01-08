import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

type Quiz = {
  id: string;
  title: string;
  questions: {
    text: string;
    options: string[];
    correctAnswer: string;
  }[];
};

// Temporary in-memory store
const quizzes: Quiz[] = [];

export async function GET() {
  return NextResponse.json(quizzes);
}

export async function POST(request: Request) {
  try {
    const { title, questions } = await request.json();
    if (!title || !questions) {
      return NextResponse.json(
        { message: "Missing title or questions" },
        { status: 400 }
      );
    }

    const newQuiz: Quiz = {
      id: nanoid(),
      title,
      questions,
    };

    quizzes.push(newQuiz);

    return NextResponse.json(newQuiz);
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { message: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
