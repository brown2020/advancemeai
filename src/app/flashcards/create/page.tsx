import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import CreateFlashcardSetClient from "./CreateFlashcardSetClient";

export default async function CreateFlashcardSetPage() {
  const { isAvailable, user } = await getServerSession();

  if (isAvailable && !user) {
    redirect(`/auth/signin?returnTo=${encodeURIComponent("/flashcards/create")}`);
  }

  return <CreateFlashcardSetClient />;
}
