import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import NewQuizClient from "./NewQuizClient";

export default async function NewQuizPage() {
  const { isAvailable, user } = await getServerSession();

  if (isAvailable && !user) {
    redirect(`/auth/signin?returnTo=${encodeURIComponent("/quizzes/new")}`);
  }

  return <NewQuizClient />;
}
