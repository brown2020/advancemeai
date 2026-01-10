import EditFlashcardSetClient from "./EditFlashcardSetClient";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";

// Metadata function with async params
export async function generateMetadata({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  // Await the params
  const { setId } = await params;
  return {
    title: `Edit Flashcard Set ${setId} | Advance.me`,
  };
}

// Page component with properly typed async params
export default async function Page({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  // Await the params
  const { setId } = await params;

  const { isAvailable, user } = await getServerSession();
  if (isAvailable && !user) {
    redirect(
      `/auth/signin?returnTo=${encodeURIComponent(`/flashcards/${setId}/edit`)}`
    );
  }

  return <EditFlashcardSetClient setId={setId} />;
}
