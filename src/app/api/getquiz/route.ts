import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
    console.error("Error retrieving quiz:", error);
    return NextResponse.json(
      { message: "Failed to retrieve quiz" },
      { status: 500 }
    );
  }
}
