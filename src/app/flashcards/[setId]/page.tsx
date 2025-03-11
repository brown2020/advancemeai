// This should be a server component (no "use client" directive)

import StudyFlashcardSetClient from "./StudyFlashcardSetClient";

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
  // Await the params
  const { setId } = await params;

  return <StudyFlashcardSetClient setId={setId} />;
}
