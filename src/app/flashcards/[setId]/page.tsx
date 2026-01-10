// This should be a server component (no "use client" directive)

import { lazy, Suspense } from "react";
import { getAdminDbOptional } from "@/config/firebase-admin";
import { getServerSession } from "@/lib/server-session";
import { isPublicFromData, mapFlashcardSet } from "@/lib/server-firestore";
import { notFound, redirect } from "next/navigation";

// Lazy load the client component
const StudyFlashcardSetClient = lazy(() => import("./StudyFlashcardSetClient"));

// Metadata function with async params
export async function generateMetadata({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  // Await the params
  const { setId } = await params;
  return {
    title: `Study Flashcard Set ${setId} | Advance.me`,
  };
}

// Page component with properly typed async params
export default async function Page({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  const { isAvailable, user } = await getServerSession();
  const db = getAdminDbOptional();

  // Server-first: if admin db isn't configured, fall back to client fetching.
  if (!db) {
    return (
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </div>
        }
      >
        <StudyFlashcardSetClient setId={setId} />
      </Suspense>
    );
  }

  const snapshot = await db.collection("flashcardSets").doc(setId).get();
  if (!snapshot.exists) {
    notFound();
  }

  const data = (snapshot.data() || {}) as Record<string, unknown>;
  const isPublic = isPublicFromData(data);
  const isOwner = Boolean(user?.uid) && data.userId === user?.uid;

  // Private set: require sign-in when server verification is available.
  if (!isPublic && !isOwner) {
    if (isAvailable && !user) {
      redirect(`/auth/signin?returnTo=${encodeURIComponent(`/flashcards/${setId}`)}`);
    }
    // If we can't verify sessions, let the client handle permissions via Firestore rules.
    return (
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </div>
        }
      >
        <StudyFlashcardSetClient setId={setId} />
      </Suspense>
    );
  }

  const initialSet = mapFlashcardSet(snapshot.id, data);

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      }
    >
      <StudyFlashcardSetClient setId={setId} initialSet={initialSet} />
    </Suspense>
  );
}
