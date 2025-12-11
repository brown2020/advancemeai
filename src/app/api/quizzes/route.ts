import { NextResponse } from "next/server";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

type Quiz = {
  id?: string;
  title: string;
  questions: {
    text: string;
    options: string[];
    correctAnswer: string;
  }[];
};

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
    // Log error in development only
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Error fetching quizzes from Firestore:", error);
    }
    return NextResponse.json(
      { message: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

// POST a new quiz to Firestore
export async function POST(request: Request) {
  try {
    const { title, questions } = await request.json();

    if (!title || !Array.isArray(questions)) {
      return NextResponse.json(
        {
          message: "Missing or invalid 'title' or 'questions' in request body",
        },
        { status: 400 }
      );
    }

    const docRef = await addDoc(collection(db, "quizzes"), {
      title,
      questions,
    });

    // Construct response object with Firestore’s auto-generated ID
    const newQuiz: Quiz = {
      id: docRef.id,
      title,
      questions,
    };

    return NextResponse.json(newQuiz);
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Error creating quiz:", error);
    }
    return NextResponse.json(
      { message: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
