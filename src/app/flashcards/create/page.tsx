import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import CreateFlashcardSetClient from "./CreateFlashcardSetClient";


export const metadata: Metadata = {
  title: "Flashcards · create | AdvanceMe AI",
  description: "AdvanceMe AI — Flashcards · create",
};

export default async function CreateFlashcardSetPage() {
  const { isAvailable, user } = await getServerSession();

  if (isAvailable && !user) {
    redirect(`/auth/signin?returnTo=${encodeURIComponent("/flashcards/create")}`);
  }

  return <CreateFlashcardSetClient />;
}
