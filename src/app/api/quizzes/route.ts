import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

// Reuse your existing Firebase config/env vars as in firebaseConfig.ts, or define them here:
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only once per server runtime
function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}
const app = getFirebaseApp();
const db = getFirestore(app);

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
    console.error("Error fetching quizzes from Firestore:", error);
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
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { message: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
