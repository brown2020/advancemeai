import { lazy, Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getAdminDbOptional } from "@/config/firebase-admin";
import { getServerSession } from "@/lib/server-session";
import { canReadFlashcardSet, mapFlashcardSet } from "@/lib/server-firestore";
import { SetPageSkeleton } from "@/components/flashcards/set/SetPageSkeleton";
import type { SetAuthor } from "@/components/flashcards/set/useSetAuthor";
import type { FlashcardSet } from "@/types/flashcard";
import { signInHref } from "@/constants/appConstants";

const StudyFlashcardSetClient = lazy(() => import("./StudyFlashcardSetClient"));

type PageProps = {
  params: Promise<{ setId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { setId } = await params;
  return {
    title: `Study Flashcard Set ${setId} | Advance.me`,
  };
}

/** Reads the owner's public profile (userProfiles is world-readable). */
async function loadAuthor(
  db: NonNullable<ReturnType<typeof getAdminDbOptional>>,
  ownerId: string
): Promise<SetAuthor | null> {
  if (!ownerId) return null;
  try {
    const snap = await db.collection("userProfiles").doc(ownerId).get();
    const data = (snap.data() ?? {}) as { displayName?: unknown; username?: unknown };
    const username = typeof data.username === "string" ? data.username : undefined;
    const displayName =
      typeof data.displayName === "string" ? data.displayName : undefined;
    const name = displayName || username;
    return name ? { name, username } : null;
  } catch {
    return null;
  }
}

function ClientPage(props: {
  setId: string;
  initialSet?: FlashcardSet;
  initialAuthor?: SetAuthor | null;
}) {
  return (
    <Suspense fallback={<SetPageSkeleton />}>
      <StudyFlashcardSetClient {...props} />
    </Suspense>
  );
}

export default async function Page({ params }: PageProps) {
  const { setId } = await params;
  const { isAvailable, user } = await getServerSession();
  const db = getAdminDbOptional();

  // Server-first: if admin db isn't configured, fall back to client fetching.
  if (!db) {
    return <ClientPage setId={setId} />;
  }

  const snapshot = await db.collection("flashcardSets").doc(setId).get();
  if (!snapshot.exists) {
    notFound();
  }

  const data = (snapshot.data() || {}) as Record<string, unknown>;
  const canRead = canReadFlashcardSet(data, user?.uid ?? null);

  if (!canRead) {
    if (!user && isAvailable) {
      redirect(signInHref(`/flashcards/${setId}`));
    }
    if (user) {
      notFound();
    }
    // Session unavailable: client fetch + Firestore rules enforce access.
    return <ClientPage setId={setId} />;
  }

  const initialSet = mapFlashcardSet(snapshot.id, data);
  const initialAuthor = await loadAuthor(db, initialSet.userId);

  return (
    <ClientPage setId={setId} initialSet={initialSet} initialAuthor={initialAuthor} />
  );
}
