// This should be a server component (no "use client" directive)

import { lazy, Suspense } from "react";

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
