import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import CreateFlashcardSetClient from "./CreateFlashcardSetClient";
import { signInHref } from "@/constants/appConstants";

export const metadata: Metadata = {
  title: "Create a flashcard set | Advance.me",
  description: "Make a new flashcard set with terms, definitions, and images.",
};

export default async function CreateFlashcardSetPage() {
  const { isAvailable, user } = await getServerSession();

  if (isAvailable && !user) {
    redirect(signInHref("/flashcards/create"));
  }

  return <CreateFlashcardSetClient />;
}
